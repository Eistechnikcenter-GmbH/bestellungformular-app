/**
 * OpenRouteService HTTP helpers.
 * Use Authorization header (not api_key query) — required for reliable server-side use on Vercel.
 */

export async function orsGet(
  apiKey: string,
  path: string,
  params: Record<string, string>
): Promise<Response> {
  const url = new URL(path.startsWith("http") ? path : `https://api.openrouteservice.org${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
    },
  });
}

export async function orsPostJson(
  apiKey: string,
  path: string,
  body: unknown
): Promise<Response> {
  const url = path.startsWith("http") ? path : `https://api.openrouteservice.org${path}`;

  return fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

type GeocodeFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
};

/** Normalize address text for geocoding (append country when missing). */
export function normalizeAddressForGeocode(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.includes("deutschland") || lower.includes("germany")) {
    return trimmed;
  }
  return `${trimmed}, Deutschland`;
}

export async function geocodeAddress(
  apiKey: string,
  address: string
): Promise<[number, number]> {
  const text = normalizeAddressForGeocode(address);
  const res = await orsGet(apiKey, "/geocode/search", {
    text,
    size: "1",
    "boundary.country": "DE",
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(
      `Geocoding failed (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  const json = (await res.json()) as { features?: GeocodeFeature[] };
  const coords = json.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length !== 2) {
    throw new Error(`Address not found: ${text}`);
  }
  return coords;
}
