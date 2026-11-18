import db from "@/lib/db";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

/**
 * Permanently deletes a user and ALL associated data across both Prisma and MongoDB collections:
 * - Profile
 * - Community Posts & all comments/likes/reposts across remaining posts
 * - Activities organized & their participants, join requests, and chat conversations
 * - Travel Plans organized & their participants, join requests, and chat conversations
 * - Join Requests sent
 * - Participations in other activities/trips
 * - Direct 1-on-1 conversations & their messages
 * - Sent messages
 * - Notifications
 * - Safety blocks & reports
 * - Identity verification records
 * - Community initiatives (Grow, Treasure drops, Find-me clues)
 * - User account record
 */
export async function deleteUserAndCascade(userId: string): Promise<{ success: boolean; details: Record<string, number> }> {
  const details: Record<string, number> = {};
  if (!userId) return { success: false, details };

  const mongo = await getDb();
  let userObjId: ObjectId | null = null;
  try {
    userObjId = new ObjectId(userId);
  } catch {}

  const userQuery = userObjId
    ? { $in: [userId, userObjId] }
    : userId;

  // 1. MongoDB Collections Cleanup

  // 1a. Community Posts authored by user
  const postDeleteRes = await mongo.collection("community_posts").deleteMany({
    authorId: userQuery,
  });
  details.communityPostsDeleted = postDeleteRes.deletedCount;

  // 1b. Clean up user's likes, reposts, and comments inside all remaining community posts
  await mongo.collection("community_posts").updateMany(
    {},
    {
      $pull: {
        likedBy: userId,
        repostedBy: userId,
        comments: {
          $or: [
            { authorId: userId },
            { userId: userId },
            ...(userObjId ? [{ authorId: userObjId }, { userId: userObjId }] : []),
          ],
        },
      } as any,
    }
  );

  // 1c. Direct conversations involving this user
  const directConvs = await mongo
    .collection("Conversation")
    .find({
      type: "DIRECT",
      participantIds: userId,
    })
    .toArray();

  if (directConvs.length > 0) {
    const directConvIds = directConvs.map((c) => c._id);
    await mongo.collection("Message").deleteMany({
      conversationId: { $in: directConvIds },
    });
    const convDeleteRes = await mongo.collection("Conversation").deleteMany({
      _id: { $in: directConvIds },
    });
    details.directConversationsDeleted = convDeleteRes.deletedCount;
  }

  // 1d. Identity Verifications
  const verifDeleteRes = await mongo.collection("identity_verifications").deleteMany({
    userId: userQuery,
  });
  details.identityVerificationsDeleted = verifDeleteRes.deletedCount;

  // 1e. Grow Initiatives, Treasure Drops, Find-me clues
  const growRes = await mongo.collection("grow_initiatives").deleteMany({
    $or: [{ creatorId: userQuery }, { authorId: userQuery }, { userId: userQuery }],
  });
  details.growInitiativesDeleted = growRes.deletedCount;

  const treasureRes = await mongo.collection("treasure_drops").deleteMany({
    $or: [{ creatorId: userQuery }, { authorId: userQuery }, { userId: userQuery }],
  });
  details.treasureDropsDeleted = treasureRes.deletedCount;

  const clueRes = await mongo.collection("find_me_clues").deleteMany({
    $or: [{ creatorId: userQuery }, { authorId: userQuery }, { userId: userQuery }],
  });
  details.findMeCluesDeleted = clueRes.deletedCount;

  // 2. Prisma Relational Cascades

  // 2a. Activities organized by user
  const organizedActivities = await db.activity.findMany({
    where: { organizerId: userId },
    select: { id: true },
  });
  const actIds = organizedActivities.map((a) => a.id);

  if (actIds.length > 0) {
    const actConvs = await db.conversation.findMany({
      where: { activityId: { in: actIds } },
      select: { id: true },
    });
    const actConvIds = actConvs.map((c) => c.id);

    if (actConvIds.length > 0) {
      await db.message.deleteMany({ where: { conversationId: { in: actConvIds } } });
      await db.conversation.deleteMany({ where: { id: { in: actConvIds } } });
    }
    await db.participant.deleteMany({ where: { activityId: { in: actIds } } });
    await db.joinRequest.deleteMany({ where: { activityId: { in: actIds } } });
    const actDeleteRes = await db.activity.deleteMany({ where: { id: { in: actIds } } });
    details.activitiesDeleted = actDeleteRes.count;
  }

  // 2b. Travel Plans organized by user
  const organizedTrips = await db.travelPlan.findMany({
    where: { organizerId: userId },
    select: { id: true },
  });
  const tripIds = organizedTrips.map((t) => t.id);

  if (tripIds.length > 0) {
    const tripConvs = await db.conversation.findMany({
      where: { travelPlanId: { in: tripIds } },
      select: { id: true },
    });
    const tripConvIds = tripConvs.map((c) => c.id);

    if (tripConvIds.length > 0) {
      await db.message.deleteMany({ where: { conversationId: { in: tripConvIds } } });
      await db.conversation.deleteMany({ where: { id: { in: tripConvIds } } });
    }
    await db.participant.deleteMany({ where: { travelPlanId: { in: tripIds } } });
    await db.joinRequest.deleteMany({ where: { travelPlanId: { in: tripIds } } });
    const tripDeleteRes = await db.travelPlan.deleteMany({ where: { id: { in: tripIds } } });
    details.travelPlansDeleted = tripDeleteRes.count;
  }

  // 2c. Direct participations, requests, messages, and profile
  await db.participant.deleteMany({ where: { userId } });
  await db.joinRequest.deleteMany({ where: { applicantId: userId } });
  await db.message.deleteMany({ where: { senderId: userId } });
  await db.notification.deleteMany({ where: { userId } });
  await db.block.deleteMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  await db.report.deleteMany({
    where: { OR: [{ reporterId: userId }, { targetId: userId, targetType: "USER" }] },
  });
  await db.profile.deleteMany({ where: { userId } });

  // 2d. Delete User record itself
  try {
    await db.user.delete({ where: { id: userId } });
    details.userDeleted = 1;
  } catch (err: any) {
    // User might already be gone
    details.userDeleted = 0;
  }

  return { success: true, details };
}

/**
 * Scans all collections in the database and purges ANY orphaned data
 * whose corresponding user account no longer exists.
 */
export async function purgeAllOrphanUserData(): Promise<{
  purgedPosts: number;
  purgedProfiles: number;
  purgedVerifications: number;
  purgedDirectChats: number;
  purgedActivities: number;
  purgedTrips: number;
  purgedGrow: number;
  purgedTreasures: number;
  purgedClues: number;
}> {
  const users = await db.user.findMany({ select: { id: true } });
  const validUserIds = new Set(users.map((u) => u.id));

  const mongo = await getDb();

  // 1. Purge orphaned community posts
  const allPosts = await mongo.collection("community_posts").find({}).toArray();
  const orphanPostIds = allPosts
    .filter((p) => {
      const aId = p.authorId?.toString();
      return !aId || !validUserIds.has(aId);
    })
    .map((p) => p._id);

  let purgedPosts = 0;
  if (orphanPostIds.length > 0) {
    const res = await mongo.collection("community_posts").deleteMany({
      _id: { $in: orphanPostIds },
    });
    purgedPosts = res.deletedCount;
  }

  // 1b. Clean comments, likes, reposts inside remaining posts
  const remainingPosts = await mongo.collection("community_posts").find({}).toArray();
  for (const post of remainingPosts) {
    let modified = false;
    let comments = Array.isArray(post.comments) ? post.comments : [];
    const filteredComments = comments.filter((c: any) => {
      const cid = (c.authorId || c.userId)?.toString();
      return cid && validUserIds.has(cid);
    });
    if (filteredComments.length !== comments.length) {
      modified = true;
      comments = filteredComments;
    }

    let likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const filteredLikes = likedBy.filter((uid: any) => validUserIds.has(uid?.toString()));
    if (filteredLikes.length !== likedBy.length) {
      modified = true;
      likedBy = filteredLikes;
    }

    let repostedBy = Array.isArray(post.repostedBy) ? post.repostedBy : [];
    const filteredReposts = repostedBy.filter((uid: any) => validUserIds.has(uid?.toString()));
    if (filteredReposts.length !== repostedBy.length) {
      modified = true;
      repostedBy = filteredReposts;
    }

    if (modified) {
      await mongo.collection("community_posts").updateOne(
        { _id: post._id },
        {
          $set: {
            comments,
            commentsCount: comments.length,
            likedBy,
            likesCount: likedBy.length,
            repostedBy,
            repostsCount: repostedBy.length,
          },
        }
      );
    }
  }

  // 2. Purge orphaned Profiles
  const allProfiles = await db.profile.findMany({ select: { id: true, userId: true } });
  const orphanProfileIds = allProfiles
    .filter((p) => !validUserIds.has(p.userId))
    .map((p) => p.id);

  let purgedProfiles = 0;
  if (orphanProfileIds.length > 0) {
    const res = await db.profile.deleteMany({
      where: { id: { in: orphanProfileIds } },
    });
    purgedProfiles = res.count;
  }

  // 3. Purge orphaned Identity Verifications
  const allVerifs = await mongo.collection("identity_verifications").find({}).toArray();
  const orphanVerifIds = allVerifs
    .filter((v) => {
      const uid = v.userId?.toString();
      return !uid || uid === "undefined" || !validUserIds.has(uid);
    })
    .map((v) => v._id);

  let purgedVerifications = 0;
  if (orphanVerifIds.length > 0) {
    const res = await mongo.collection("identity_verifications").deleteMany({
      _id: { $in: orphanVerifIds },
    });
    purgedVerifications = res.deletedCount;
  }

  // 4. Purge orphaned Direct Conversations where any participant was deleted
  const directConvs = await mongo
    .collection("Conversation")
    .find({ type: "DIRECT" })
    .toArray();

  const orphanDirectConvIds = directConvs
    .filter((c) => {
      const pids = c.participantIds || [];
      return pids.length < 2 || pids.some((pid: any) => !validUserIds.has(pid?.toString()));
    })
    .map((c) => c._id);

  let purgedDirectChats = 0;
  if (orphanDirectConvIds.length > 0) {
    await mongo.collection("Message").deleteMany({
      conversationId: { $in: orphanDirectConvIds },
    });
    const res = await mongo.collection("Conversation").deleteMany({
      _id: { $in: orphanDirectConvIds },
    });
    purgedDirectChats = res.deletedCount;
  }

  // 5. Purge orphaned Activities
  const activities = await db.activity.findMany({ select: { id: true, organizerId: true } });
  const orphanActIds = activities
    .filter((a) => !validUserIds.has(a.organizerId))
    .map((a) => a.id);

  let purgedActivities = 0;
  if (orphanActIds.length > 0) {
    await db.participant.deleteMany({ where: { activityId: { in: orphanActIds } } });
    await db.joinRequest.deleteMany({ where: { activityId: { in: orphanActIds } } });
    const res = await db.activity.deleteMany({ where: { id: { in: orphanActIds } } });
    purgedActivities = res.count;
  }

  // 6. Purge orphaned Travel Plans
  const trips = await db.travelPlan.findMany({ select: { id: true, organizerId: true } });
  const orphanTripIds = trips
    .filter((t) => !validUserIds.has(t.organizerId))
    .map((t) => t.id);

  let purgedTrips = 0;
  if (orphanTripIds.length > 0) {
    await db.participant.deleteMany({ where: { travelPlanId: { in: orphanTripIds } } });
    await db.joinRequest.deleteMany({ where: { travelPlanId: { in: orphanTripIds } } });
    const res = await db.travelPlan.deleteMany({ where: { id: { in: orphanTripIds } } });
    purgedTrips = res.count;
  }

  // 7. Purge orphaned Grow Initiatives, Treasures, Clues
  let purgedGrow = 0;
  const growList = await mongo.collection("grow_initiatives").find({}).toArray();
  const orphanGrowIds = growList
    .filter((g) => {
      const cid = (g.creatorId || g.authorId || g.userId)?.toString();
      return cid && !validUserIds.has(cid);
    })
    .map((g) => g._id);
  if (orphanGrowIds.length > 0) {
    const res = await mongo.collection("grow_initiatives").deleteMany({ _id: { $in: orphanGrowIds } });
    purgedGrow = res.deletedCount;
  }

  let purgedTreasures = 0;
  const treasureList = await mongo.collection("treasure_drops").find({}).toArray();
  const orphanTreasureIds = treasureList
    .filter((t) => {
      const cid = (t.creatorId || t.authorId || t.userId)?.toString();
      return cid && !validUserIds.has(cid);
    })
    .map((t) => t._id);
  if (orphanTreasureIds.length > 0) {
    const res = await mongo.collection("treasure_drops").deleteMany({ _id: { $in: orphanTreasureIds } });
    purgedTreasures = res.deletedCount;
  }

  let purgedClues = 0;
  const clueList = await mongo.collection("find_me_clues").find({}).toArray();
  const orphanClueIds = clueList
    .filter((c) => {
      const cid = (c.creatorId || c.authorId || c.userId)?.toString();
      return cid && !validUserIds.has(cid);
    })
    .map((c) => c._id);
  if (orphanClueIds.length > 0) {
    const res = await mongo.collection("find_me_clues").deleteMany({ _id: { $in: orphanClueIds } });
    purgedClues = res.deletedCount;
  }

  return {
    purgedPosts,
    purgedProfiles,
    purgedVerifications,
    purgedDirectChats,
    purgedActivities,
    purgedTrips,
    purgedGrow,
    purgedTreasures,
    purgedClues,
  };
}

