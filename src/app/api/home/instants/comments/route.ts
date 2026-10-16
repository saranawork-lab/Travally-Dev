import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/home/instants/comments?postId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Valid postId required" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = Array.isArray(post.comments) ? post.comments : [];
    return NextResponse.json({ success: true, comments, commentsCount: comments.length });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/home/instants/comments
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required to comment" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content, parentId, replyToName } = body;

    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Valid postId required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const newComment = {
      id: new ObjectId().toString(),
      authorId: currentUser.id,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      authorAvatar: currentUser.avatarUrl || null,
      authorCity: currentUser.city || null,
      authorRank: currentUser.joinRank || null,
      isVerified: currentUser.isVerified || false,
      content: content.trim(),
      parentId: parentId || null,
      replyToName: replyToName ? replyToName.trim() : null,
      createdAt: new Date().toISOString(),
    };

    await db.collection("community_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $push: { comments: newComment as any },
        $inc: { commentsCount: 1 },
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    const updatedPost = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });
    const totalCount = Array.isArray(updatedPost?.comments) ? updatedPost.comments.length : (updatedPost?.commentsCount || 1);

    return NextResponse.json({
      success: true,
      comment: newComment,
      commentsCount: totalCount,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

// DELETE /api/home/instants/comments?postId=xxx&commentId=yyy
export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const commentId = searchParams.get("commentId");

    if (!postId || !ObjectId.isValid(postId) || !commentId) {
      return NextResponse.json({ error: "Valid postId and commentId required" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.collection("community_posts").findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments: any[] = Array.isArray(post.comments) ? post.comments : [];
    const target = comments.find((c) => c.id === commentId);

    if (!target) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Permission: must be comment author, post author, or admin
    if (
      target.authorId !== currentUser.id &&
      post.authorId !== currentUser.id &&
      currentUser.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Also remove any replies targeting this comment if it was a parent comment
    const updatedComments = comments.filter((c) => c.id !== commentId && c.parentId !== commentId);
    const removedCount = comments.length - updatedComments.length;

    await db.collection("community_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          comments: updatedComments,
          commentsCount: Math.max(0, (post.commentsCount || comments.length) - removedCount),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      commentsCount: updatedComments.length,
      removedCount,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
