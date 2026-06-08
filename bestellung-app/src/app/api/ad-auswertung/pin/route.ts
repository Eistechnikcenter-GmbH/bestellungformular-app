import { NextResponse } from "next/server";
import {
  createAdPinToken,
  getAdPinCookieName,
  verifyAdPin,
} from "@/lib/auth/ad-pin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";

    if (!verifyAdPin(pin)) {
      return NextResponse.json({ ok: false, error: "Falscher PIN" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(getAdPinCookieName(), createAdPinToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/ad-auswertung",
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage" }, { status: 400 });
  }
}
