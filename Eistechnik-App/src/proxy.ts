import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAndRefresh, getCookieName, getSessionMaxAgeSeconds } from "@/lib/auth/edge-session";

const LOGIN_PATH = "/login";
const AUTH_API_PREFIX = "/api/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (
    pathname === LOGIN_PATH ||
    pathname.startsWith(AUTH_API_PREFIX) ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.ETC_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getCookieName())?.value;
  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const result = await verifyAndRefresh(token, secret);
  if (!result) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    res.cookies.delete(getCookieName());
    return res;
  }

  // API-Routen: Session prüfen, aber kein Cookie-Update (verhindert Fetch-Loops im Dev)
  if (isApi) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  if (result.newToken !== token) {
    res.cookies.set(getCookieName(), result.newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionMaxAgeSeconds(),
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|signing/).*)"],
};
