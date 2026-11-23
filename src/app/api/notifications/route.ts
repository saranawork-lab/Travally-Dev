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
      take: 100,
    });

    // Group NEW_MESSAGE notifications from the same sender and conversation within 1 day (24h)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const groupedNotifications: any[] = [];
    const messageGroups: { [groupKey: string]: any } = {};

    for (const notif of notifications) {
      if (notif.type === "NEW_MESSAGE") {
        // Extract sender name from body (e.g. "Priya Iyer: 1" -> "Priya Iyer")
        const colonIdx = notif.body.indexOf(":");
        const rawSender = colonIdx !== -1 ? notif.body.substring(0, colonIdx).trim() : "Companion";
        const sender = rawSender.replace(/\s*\(\d+.*?\)/, "").trim();

        const notifTime = new Date(notif.createdAt).getTime();
        const groupKey = `${notif.actionUrl || notif.title}:::${sender}`;
        const existingGroup = messageGroups[groupKey];

        // Within 1 day (24 hours) from the latest message in this group
        if (existingGroup && Math.abs(existingGroup.latestTime - notifTime) <= ONE_DAY_MS) {
          existingGroup.count += 1;
          existingGroup.groupedIds.push(notif.id);
          if (!notif.isRead) {
            existingGroup.isRead = false;
          }
          continue;
        } else {
          // Parse latest preview message text
          const rawText = colonIdx !== -1 ? notif.body.substring(colonIdx + 1).trim() : notif.body;
          const cleanText = rawText.replace(/^\(\d+.*?\):\s*/, "").trim();

          const newGroup = {
            ...notif,
            sender,
            latestText: cleanText,
            count: 1,
            groupedIds: [notif.id],
            latestTime: notifTime,
          };
          messageGroups[groupKey] = newGroup;
          groupedNotifications.push(newGroup);
        }
      } else {
        groupedNotifications.push(notif);
      }
    }

    const formattedNotifications = groupedNotifications.map((n) => {
      if (n.type === "NEW_MESSAGE" && n.count > 1) {
        const baseTitle = n.title.replace(/\s*\(\d+\)/, "").trim();
        return {
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: `${baseTitle} (${n.count})`,
          body: `${n.sender} (${n.count}): ${n.latestText}`,
          actionUrl: n.actionUrl,
          isRead: n.isRead,
          createdAt: n.createdAt,
          count: n.count,
          groupedIds: n.groupedIds,
        };
      }
      return n;
    });

    const unreadCount = formattedNotifications.filter((n) => !n.isRead).length;

    const response = NextResponse.json({ notifications: formattedNotifications, unreadCount });
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
    if (body?.ids && Array.isArray(body.ids)) {
      await db.notification.updateMany({
        where: { id: { in: body.ids }, userId: user.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "Notifications marked as read" });
    }
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
