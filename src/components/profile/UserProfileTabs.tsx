"use client";

import React from "react";
import { UserInstantsSection } from "@/components/home/UserInstantsSection";

export type ProfileContentTab = "instants" | "activities" | "find-me" | "treasure";
export type ActivitySubFilter = "all" | "companion" | "travel" | "grow";

interface UserProfileTabsProps {
  userId: string;
  userName: string;
  isOwn: boolean;
}

export const UserProfileTabs: React.FC<UserProfileTabsProps> = ({ userId, userName, isOwn }) => {
  return (
    <div className="space-y-6">
      {/* ── All Posts / Cards Feed Directly (Tabs & Classifications Removed) ── */}
      <div className="transition-all duration-300">
        <UserInstantsSection
          userId={userId}
          userName={userName}
          isOwn={isOwn}
        />
      </div>
    </div>
  );
};
