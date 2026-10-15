import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blocks = await db.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedBlocks = blocks.map((b) => ({
      id: b.id,
      blockedId: b.blockedId,
      createdAt: b.createdAt,
      blocked: {
        displayName: b.blocked?.profile?.displayName || b.blocked?.email?.split("@")[0] || "User",
        email: b.blocked?.email,
        avatarUrl: b.blocked?.profile?.avatarUrl,
      },
    }));

    return NextResponse.json({ blocks: formattedBlocks });
  } catch (error) {
    console.error("GET block error:", error);
    return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedId } = await req.json();

    if (!blockedId || blockedId === user.id) {
      return NextResponse.json({ error: "Invalid user to block" }, { status: 400 });
    }

    // Upsert block
    const block = await db.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId: user.id,
        blockedId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User blocked successfully. They will not be able to interact with you or see your activities.",
      block,
    });
  } catch (error) {
    console.error("POST block error:", error);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedId } = await req.json();
    if (!blockedId) {
      return NextResponse.json({ error: "Invalid blocked ID" }, { status: 400 });
    }

    await db.block.deleteMany({
      where: {
        blockerId: user.id,
        blockedId,
      },
    });

    return NextResponse.json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("DELETE block error:", error);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}

