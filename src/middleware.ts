import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "travally_session";

function isValidObjectId(id: unknown): boolean {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

function isTokenActive(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const jsonString = atob(base64);
    const payload = JSON.parse(jsonString);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // expired
    }
    return Boolean(payload.userId && isValidObjectId(payload.userId));
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = isTokenActive(token);

  // Allow all static public assets (images, files with extensions like .png, .jpg, .svg, .ico)
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // If a stale or invalid session cookie is present, automatically delete it from browser
  if (token && !isAuthenticated) {
    const isPublicPage =
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/discover" ||
      pathname === "/safety" ||
      pathname.startsWith("/safety/live/") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/destinations");

    const response = isPublicPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // If user is NOT authenticated:
  // Public pages: landing (/), login (/login), register (/register), discover (/discover), safety (/safety), categories, destinations
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/discover" ||
    pathname === "/safety" ||
    pathname.startsWith("/safety/live/") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/destinations");

  if (!isAuthenticated && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

