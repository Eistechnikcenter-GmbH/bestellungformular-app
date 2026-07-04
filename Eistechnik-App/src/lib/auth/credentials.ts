/**
 * Verify login (ETC-Team + password) and optional TOTP 2FA.
 */

import { timingSafeEqual } from "crypto";

const EXPECTED_USER = "ETC-Team";

function getPassword(): string {
  const p = process.env.ETC_LOGIN_PASSWORD;
  if (!p) throw new Error("ETC_LOGIN_PASSWORD is not set");
  return p;
}

function get2FASecret(): string | undefined {
  return process.env.ETC_2FA_SECRET?.trim() || undefined;
}

/** Constant-time string compare (pad to 64 chars to avoid length leak). */
function safeCompare(a: string, b: string): boolean {
  const pad = (s: string) => (s + "\0".repeat(64)).slice(0, 64);
  const aa = Buffer.from(pad(a), "utf8");
  const bb = Buffer.from(pad(b), "utf8");
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function verifyPassword(username: string, password: string): boolean {
  if (username !== EXPECTED_USER) return false;
  return safeCompare(password, getPassword());
}

export async function verify2FA(token: string): Promise<boolean> {
  const secret = get2FASecret();
  if (!secret) return true; // 2FA disabled
  if (!token || token.length !== 6) return false;
  try {
    const { authenticator } = await import("otplib");
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}

export function is2FARequired(): boolean {
  return !!get2FASecret();
}

export function getExpectedUsername(): string {
  return EXPECTED_USER;
}
