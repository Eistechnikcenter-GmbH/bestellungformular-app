/**
 * Signed session cookie for auth. Session expires after 2 days without use (lastActivity).
 */

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "etc_session";
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export type SessionPayload = {
  u: string;
  t: number; // lastActivity timestamp
};

function getSecret(): string {
  const s = process.env.ETC_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ETC_SESSION_SECRET must be set and at least 16 characters");
  }
  return s;
}

function sign(payload: SessionPayload, secret: string): string {
  const data = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  const encoded = Buffer.from(data, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

function verify(token: string, secret: string): SessionPayload | null {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const data = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(data) as SessionPayload;
    if (typeof payload.u !== "string" || typeof payload.t !== "number") return null;
    const expected = createHmac("sha256", secret).update(data).digest("base64url");
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Create a new session token (for login). */
export function createSession(username: string): string {
  const secret = getSecret();
  return sign({ u: username, t: Date.now() }, secret);
}

/**
 * Verify token and check not expired (2 days since lastActivity).
 * Returns payload if valid, null otherwise.
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    const payload = verify(token, getSecret());
    if (!payload) return null;
    if (Date.now() - payload.t > MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Build refreshed payload (new lastActivity) for cookie refresh. */
export function refreshPayload(payload: SessionPayload): SessionPayload {
  return { u: payload.u, t: Date.now() };
}

/** Create token from payload (for refresh). */
export function createSessionFromPayload(payload: SessionPayload): string {
  return sign(payload, getSecret());
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionMaxAgeSeconds(): number {
  return Math.floor(MAX_AGE_MS / 1000);
}
