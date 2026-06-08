/**
 * Session cookie for Ad-Auswertung PIN gate (browser session, no fixed expiry).
 */

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ad_auswertung_unlocked";
const PIN = "1404";

function getSecret(): string {
  const s = process.env.ETC_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ETC_SESSION_SECRET must be set and at least 16 characters");
  }
  return s;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyAdPin(pin: string): boolean {
  return pin === PIN;
}

export function createAdPinToken(): string {
  const secret = getSecret();
  const payload = `unlocked:${Date.now()}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload, secret)}`;
}

export function verifyAdPinToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  try {
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    if (!payload.startsWith("unlocked:")) return false;
    const expected = sign(payload, getSecret());
    if (
      expected.length !== sig.length ||
      !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getAdPinCookieName(): string {
  return COOKIE_NAME;
}
