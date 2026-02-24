import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAndRefresh, getCookieName, getSessionMaxAgeSeconds } from "@/lib/auth/edge-session";

const LOGIN_PATH = "/login";
const AUTH_API_PREFIX = "/api/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH || pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  const secret = process.env.ETC_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getCookieName())?.value;
  if (!token) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const result = await verifyAndRefresh(token, secret);
  if (!result) {
    const res = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    res.cookies.delete(getCookieName());
    return res;
  }

  const res = NextResponse.next();
  res.cookies.set(getCookieName(), result.newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getSessionMaxAgeSeconds(),
    path: "/",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|signing/).*)"],
};
