import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, verify2FA, is2FARequired } from "@/lib/auth/credentials";
import {
  createSession,
  getCookieName,
  getSessionMaxAgeSeconds,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const totp = typeof body.totp === "string" ? body.totp.replace(/\s/g, "") : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Benutzername und Passwort erforderlich." },
        { status: 400 }
      );
    }

    if (!verifyPassword(username, password)) {
      return NextResponse.json(
        { error: "Ungültige Anmeldung." },
        { status: 401 }
      );
    }

    if (is2FARequired()) {
      if (!totp) {
        return NextResponse.json(
          { error: "Bitte 2FA-Code eingeben.", require2FA: true },
          { status: 400 }
        );
      }
      const valid2FA = await verify2FA(totp);
      if (!valid2FA) {
        return NextResponse.json(
          { error: "Ungültiger 2FA-Code." },
          { status: 401 }
        );
      }
    }

    const token = createSession(username);
    const res = NextResponse.json({ ok: true, redirect: body.redirect ?? "/" });
    res.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionMaxAgeSeconds(),
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Anmeldung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
