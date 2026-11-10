import { NextResponse } from "next/server";
import { purgeAllOrphanUserData } from "@/lib/userCleanup";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const stats = await purgeAllOrphanUserData();
    return NextResponse.json({
      success: true,
      message: "Orphaned user data successfully purged across all collections",
      stats,
    });
  } catch (error: any) {
    console.error("Purge orphans error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to purge orphan records" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

