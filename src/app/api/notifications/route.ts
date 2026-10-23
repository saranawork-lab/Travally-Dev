import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const response = NextResponse.json({ notifications, unreadCount });
    response.headers.set("Cache-Control", "private, s-maxage=5, stale-while-revalidate=15");
    return response;
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.id) {
      await db.notification.updateMany({
        where: { id: body.id, userId: user.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
