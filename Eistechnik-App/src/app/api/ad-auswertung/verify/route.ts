import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdPinCookieName, verifyAdPinToken } from "@/lib/auth/ad-pin";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdPinCookieName())?.value;
  return NextResponse.json({ unlocked: verifyAdPinToken(token) });
}
