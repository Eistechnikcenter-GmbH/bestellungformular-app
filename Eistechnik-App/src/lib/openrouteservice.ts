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
type NominatimResult = {
  lat?: string;
  lon?: string;
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

function withoutUmlauts(value: string): string {
  return value
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}

async function geocodeWithNominatim(address: string): Promise<[number, number] | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "de");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent": "bestellungformular-app/1.0 (server geocoding fallback)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as NominatimResult[];
  const row = rows[0];
  if (!row?.lat || !row?.lon) return null;
  const lat = Number.parseFloat(row.lat);
  const lon = Number.parseFloat(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return [lon, lat];
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
  const variants = [text, text.replace("straße", "strasse"), withoutUmlauts(text)];
  const uniqueVariants = [...new Set(variants.map((v) => v.trim()).filter(Boolean))];

  let lastError: string | null = null;
  for (const variant of uniqueVariants) {
    const res = await orsGet(apiKey, "/geocode/autocomplete", {
      text: variant,
      size: "1",
      "boundary.country": "DE",
      layers: "address,street,venue,locality",
    });
    if (res.ok) {
      const json = (await res.json()) as { features?: GeocodeFeature[] };
      const coords = coordsFromFeatures(json.features);
      if (coords) return coords;
      lastError = `Address not found: ${variant}`;
      continue;
    }
    const detail = (await res.text()).slice(0, 220);
    lastError = `Geocoding failed (${res.status})${detail ? `: ${detail}` : ""}`;
  }

  for (const variant of uniqueVariants) {
    const fallback = await geocodeWithNominatim(variant);
    if (fallback) return fallback;
  }

  throw new Error(lastError ?? `Address not found: ${text}`);
}
