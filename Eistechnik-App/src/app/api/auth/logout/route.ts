import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth/session";

export async function POST() {
  const name = getCookieName();
  const res = NextResponse.json({ ok: true });
  // Clear session cookie (same path/options as when set)
  res.cookies.set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
  return res;
}
