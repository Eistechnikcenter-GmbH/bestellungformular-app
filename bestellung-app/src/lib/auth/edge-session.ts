/**
 * Session cookie verify + refresh for Edge (middleware). Uses Web Crypto; no Node crypto.
 */

const COOKIE_NAME = "etc_session";
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export type SessionPayload = {
  u: string;
  t: number;
};

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const bin = atob(base64);
  return new TextDecoder().decode(new Uint8Array([...bin].map((c) => c.charCodeAt(0))));
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncode(sig);
}

async function hmacVerify(secret: string, data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(secret, data);
  if (expected.length !== signature.length) return false;
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(signature);
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i]! ^ b[i]!;
  return out === 0;
}

export async function verifyAndRefresh(
  token: string,
  secret: string
): Promise<{ payload: SessionPayload; newToken: string } | null> {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let data: string;
  try {
    data = base64UrlDecode(encoded);
  } catch {
    return null;
  }
  const payload = JSON.parse(data) as SessionPayload;
  if (typeof payload.u !== "string" || typeof payload.t !== "number") return null;
  const ok = await hmacVerify(secret, data, sig);
  if (!ok) return null;
  if (Date.now() - payload.t > MAX_AGE_MS) return null;
  const refreshed = { u: payload.u, t: Date.now() };
  const newData = JSON.stringify(refreshed);
  const newSig = await hmacSign(secret, newData);
  const bytes = new TextEncoder().encode(newData);
  const binary = String.fromCharCode(...bytes);
  const newEncoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const newToken = `${newEncoded}.${newSig}`;
  return { payload: refreshed, newToken };
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionMaxAgeSeconds(): number {
  return Math.floor(MAX_AGE_MS / 1000);
}
