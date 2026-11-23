import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMessageTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isActivityUpcoming(date: Date | string, startTime: string): boolean {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return false;
  const [hours, minutes] = (startTime || "00:00").split(":").map(Number);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d.getTime() > Date.now();
}

export function isPastCutoff(date: Date | string, startTime: string, cutoffHours: number): boolean {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return false;
  const [hours, minutes] = (startTime || "00:00").split(":").map(Number);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  const cutoffTime = Date.now() + cutoffHours * 60 * 60 * 1000;
  return d.getTime() < cutoffTime;
}

export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

export function formatLastSeen(lastSeenAt: string | Date | null | undefined): string {
  if (!lastSeenAt) return "Offline";

  const date = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  const timeMs = date.getTime();
  if (isNaN(timeMs)) return "Offline";

  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - timeMs);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffSecs < 60) {
    return "Active just now";
  }

  if (diffMins < 60) {
    return `Last seen ${diffMins}m ago`;
  }

  const nowDate = new Date(nowMs);
  const isToday =
    nowDate.getDate() === date.getDate() &&
    nowDate.getMonth() === date.getMonth() &&
    nowDate.getFullYear() === date.getFullYear();

  if (isToday) {
    return `Last seen today at ${timeStr}`;
  }

  const yesterdayDate = new Date(nowMs - 86400000);
  const isYesterday =
    yesterdayDate.getDate() === date.getDate() &&
    yesterdayDate.getMonth() === date.getMonth() &&
    yesterdayDate.getFullYear() === date.getFullYear();

  if (isYesterday) {
    return `Last seen yesterday at ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `Last seen ${dateStr} at ${timeStr}`;
}
