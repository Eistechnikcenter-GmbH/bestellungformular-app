/**
 * OpenRouteService HTTP helpers.
 * Geocoding uses /geocode/autocomplete (search endpoint is often disallowed on API keys).
 */

export async function orsGet(
  apiKey: string,
  path: string,
  params: Record<string, string>
): Promise<Response> {
  const url = new URL(
    path.startsWith("http") ? path : `https://api.openrouteservice.org${path}`
  );
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
  const url = path.startsWith("http")
    ? path
    : `https://api.openrouteservice.org${path}`;

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

function coordsFromFeatures(
  features: GeocodeFeature[] | undefined
): [number, number] | null {
  const coords = features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length !== 2) return null;
  return coords;
}

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

/**
 * Resolve coordinates via autocomplete (same API family as address suggestions).
 * Avoids /geocode/search which returns 403 "Access to this API has been disallowed" on many keys.
 */
export async function geocodeAddress(
  apiKey: string,
  address: string
): Promise<[number, number]> {
  const text = normalizeAddressForGeocode(address);

  const res = await orsGet(apiKey, "/geocode/autocomplete", {
    text,
    size: "1",
    "boundary.country": "DE",
    layers: "address,street,venue,locality",
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(
      `Geocoding failed (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  const json = (await res.json()) as { features?: GeocodeFeature[] };
  const coords = coordsFromFeatures(json.features);
  if (!coords) {
    throw new Error(`Address not found: ${text}`);
  }
  return coords;
}
