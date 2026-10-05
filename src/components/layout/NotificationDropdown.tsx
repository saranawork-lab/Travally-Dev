"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const getNotificationTypeConfig = (type: string) => {
  switch (type) {
    case "NEW_MESSAGE":
      return {
        barColor: "border-l-emerald-500",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400",
        label: "Message",
      };
    case "REQUEST_RECEIVED":
      return {
        barColor: "border-l-orange-500",
        badgeBg: "bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-400",
        label: "Request",
      };
    case "REQUEST_ACCEPTED":
      return {
        barColor: "border-l-teal-500",
        badgeBg: "bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400",
        label: "Accepted",
      };
    case "REQUEST_DECLINED":
    case "ACTIVITY_CANCELLED":
      return {
        barColor: "border-l-rose-500",
        badgeBg: "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400",
        label: "Update",
      };
    default:
      return {
        barColor: "border-l-emerald-500",
        badgeBg: "bg-slate-100 dark:bg-[#16201b] text-slate-700 dark:text-slate-300",
        label: "Notice",
      };
  }
};

const formatNotificationBody = (body: string) => {
  if (!body) return "";
  if (body.includes('{"text":') || body.includes('"text":')) {
    try {
      const colonIdx = body.indexOf(":");
      const sender = colonIdx !== -1 ? body.slice(0, colonIdx).trim() : null;
      const jsonPart = colonIdx !== -1 ? body.slice(colonIdx + 1).trim() : body;
      const parsed = JSON.parse(jsonPart);
      const text = parsed?.text || "Shared an attachment";
      return sender ? `${sender}: ${text}` : text;
    } catch {
      // fallback
    }
  }
  return body;
};

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore if not logged in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchNotifications();
    }, 20000); // 20s poll with visibility gate
    return () => clearInterval(interval);
  }, []);

  // Click outside to close notifications dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131c18] transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 dark:from-orange-950 dark:to-amber-950 text-[10px] font-extrabold text-orange-900 dark:text-orange-200 border border-orange-300/90 dark:border-orange-700 shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#111815] border border-slate-200 dark:border-emerald-950/80 shadow-2xl z-50 overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-emerald-950/60 bg-slate-50/70 dark:bg-[#16201b]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-emerald-950/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                No notifications yet. You will be alerted when requests or messages arrive!
              </div>
            ) : (
              notifications.map((n) => {
                const config = getNotificationTypeConfig(n.type);
                const notificationContent = (
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${config.badgeBg}`}>
                          {config.label}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                      {formatNotificationBody(n.body)}
                    </p>
                  </div>
                );

                if (n.actionUrl) {
                  return (
                    <Link
                      key={n.id}
                      href={n.actionUrl}
                      onClick={() => setIsOpen(false)}
                      className={`block p-3.5 border-l-4 ${config.barColor} transition-all duration-200 cursor-pointer ${
                        !n.isRead
                          ? "bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50"
                          : "hover:bg-slate-50 dark:hover:bg-[#16201b]/70"
                      }`}
                    >
                      {notificationContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 border-l-4 ${config.barColor} transition-colors ${
                      !n.isRead
                        ? "bg-emerald-50/40 dark:bg-emerald-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-[#16201b]/50"
                    }`}
                  >
                    {notificationContent}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};


