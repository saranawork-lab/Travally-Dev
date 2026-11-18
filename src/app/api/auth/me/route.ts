import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, AuthService, invalidateSessionCache } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    invalidateSessionCache();
    const user = await getCurrentUser();
    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      // If an invalid or orphan session cookie is present, clear it to prevent client loops
      const cookieStore = cookies();
      if (cookieStore.get(AuthService.getCookieName())) {
        response.cookies.set({
          name: AuthService.getCookieName(),
          value: "",
          maxAge: 0,
          path: "/",
        });
      }
      return response;
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

