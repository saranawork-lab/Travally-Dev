import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/home/instants?userId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const db = await getDb();
    const query: any = {};
    if (userId) {
      query.authorId = userId;
    }

    const posts = await db
      .collection("community_posts")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Map _id to id and provide field aliases for both Home and Account Instants
    const formatted = posts.map((p) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined,
      caption: p.content,
      location: p.locationName,
      userId: p.authorId,
      userName: p.authorName,
      userAvatar: p.authorAvatar,
      likes: p.likedBy || [],
      commentsCount: p.commentsCount !== undefined ? p.commentsCount : (Array.isArray(p.comments) ? p.comments.length : 0),
      comments: Array.isArray(p.comments) ? p.comments : [],
    }));

    return NextResponse.json({ success: true, posts: formatted, instants: formatted });
  } catch (error) {
    console.error("Error fetching community instants:", error);
    return NextResponse.json({ error: "Failed to fetch instants" }, { status: 500 });
  }
}

// POST /api/home/instants
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to post" }, { status: 401 });
    }

    const body = await req.json();
    const { content, imageUrl, locationName } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Post content cannot be empty" }, { status: 400 });
    }

    const db = await getDb();
    const newPost = {
      authorId: currentUser.id,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      authorAvatar: currentUser.avatarUrl || null,
      authorCity: currentUser.city || locationName || null,
      authorRank: currentUser.joinRank || null,
      isVerified: currentUser.isVerified || false,
      content: content.trim(),
      imageUrl: imageUrl || null,
      locationName: locationName || currentUser.city || null,
      likesCount: 0,
      likedBy: [],
      repostsCount: 0,
      repostedBy: [],
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("community_posts").insertOne(newPost);

    return NextResponse.json({
      success: true,
      post: {
        ...newPost,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating community instant:", error);
    return NextResponse.json({ error: "Failed to publish instant" }, { status: 500 });
  }
}

// PATCH /api/home/instants (toggle like or repost)
export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const postId = body.postId || body.id;
    const action = body.action || "like";

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Valid post ID required" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Handle Repost
    if (action === "repost") {
      const repostedBy: string[] = Array.isArray(post.repostedBy) ? post.repostedBy : [];
      const hasReposted = repostedBy.includes(currentUser.id);

      const updatedRepostedBy = hasReposted
        ? repostedBy.filter((id) => id !== currentUser.id)
        : [...repostedBy, currentUser.id];

      await db.collection("community_posts").updateOne(
        { _id: new ObjectId(postId) },
        {
          $set: {
            repostedBy: updatedRepostedBy,
            repostsCount: updatedRepostedBy.length,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        repostsCount: updatedRepostedBy.length,
        hasReposted: !hasReposted,
      });
    }

    // Default: Handle Like
    const likedBy: string[] = Array.isArray(post.likedBy) ? post.likedBy : [];
    const hasLiked = likedBy.includes(currentUser.id);

    const updatedLikedBy = hasLiked
      ? likedBy.filter((id) => id !== currentUser.id)
      : [...likedBy, currentUser.id];

    await db.collection("community_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          likedBy: updatedLikedBy,
          likesCount: updatedLikedBy.length,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      likesCount: updatedLikedBy.length,
      likes: updatedLikedBy,
      hasLiked: !hasLiked,
    });
  } catch (error) {
    console.error("Error toggling like or repost:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// PUT /api/home/instants (edit post)
export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const postId = body.postId || body.id;
    const content = body.content || body.caption;
    const locationName = body.locationName !== undefined ? body.locationName : body.location;
    const imageUrl = body.imageUrl;

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Valid post ID required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Post content cannot be empty" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only author or admin can edit
    if (post.authorId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const updateFields: any = {
      content: content.trim(),
      locationName: locationName !== undefined ? locationName.trim() || null : post.locationName,
      imageUrl: imageUrl !== undefined ? imageUrl || null : post.imageUrl,
      updatedAt: new Date().toISOString(),
      isEdited: true,
    };

    await db.collection("community_posts").updateOne(
      { _id: new ObjectId(postId) },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        ...updateFields,
        id: post._id.toString(),
        _id: undefined,
      },
    });
  } catch (error) {
    console.error("Error updating instant:", error);
    return NextResponse.json({ error: "Failed to update instant" }, { status: 500 });
  }
}

// DELETE /api/home/instants?id=xxx
export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Valid post ID required" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only author or admin can delete
    if (post.authorId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await db.collection("community_posts").deleteOne({ _id: new ObjectId(postId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting instant:", error);
    return NextResponse.json({ error: "Failed to delete instant" }, { status: 500 });
  }
}
