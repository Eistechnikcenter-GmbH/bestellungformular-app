import { NextResponse } from "next/server";
import { getOpenRouteServiceConfig } from "@/lib/config";
import { orsGet } from "@/lib/openrouteservice";

type OrsProperties = {
  label?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postalcode?: string | number;
  locality?: string;
  region?: string;
  country?: string;
};

type OrsFeature = {
  properties?: OrsProperties;
};
type NominatimSuggestion = {
  display_name?: string;
  address?: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
  };
};

export type AddressSuggestion = {
  label: string;
  address: string;
};

function str(v: string | number | undefined): string {
  if (v == null) return "";
  return String(v).trim();
}

/** Display + routing string with PLZ when the provider returns it. */
function formatSuggestion(properties: OrsProperties): AddressSuggestion | null {
  const postcode = str(properties.postalcode);
  const locality = str(properties.locality);
  const street = str(properties.street);
  const housenumber = str(properties.housenumber);
  const name = str(properties.name);
  const region = str(properties.region);
  const country = str(properties.country);

  const streetLine = [street, housenumber].filter(Boolean).join(" ").trim() || name;
  const plzOrt = [postcode, locality].filter(Boolean).join(" ");

  let label: string;
  if (streetLine && plzOrt) {
    label = `${streetLine}, ${plzOrt}`;
  } else if (plzOrt) {
    label = plzOrt;
  } else if (streetLine) {
    label = streetLine;
  } else {
    label = str(properties.label) || name;
  }

  // Pelias "label" often omits PLZ — always show it when we have it.
  if (postcode && !label.includes(postcode)) {
    if (locality && label.includes(locality)) {
      label = label.replace(locality, `${postcode} ${locality}`);
    } else {
      label = `${label}, ${postcode}`;
    }
  }

  if (region && !label.includes(region)) {
    label = `${label}, ${region}`;
  }
  if (country && country !== "Germany" && country !== "DE" && !label.includes(country)) {
    label = `${label}, ${country}`;
  }

  const addressForRoute = [
    streetLine,
    plzOrt,
    country === "Germany" || country === "DE" || !country ? "Deutschland" : country,
  ]
    .filter(Boolean)
    .join(", ");

  const address = addressForRoute || label;
  if (!label.trim()) return null;

  return { label, address };
}

function formatNominatimSuggestion(row: NominatimSuggestion): AddressSuggestion | null {
  const display = row.display_name?.trim() ?? "";
  if (!display) return null;
  const road = row.address?.road?.trim() ?? "";
  const house = row.address?.house_number?.trim() ?? "";
  const postcode = row.address?.postcode?.trim() ?? "";
  const city =
    row.address?.city?.trim() ??
    row.address?.town?.trim() ??
    row.address?.village?.trim() ??
    "";
  const streetLine = [road, house].filter(Boolean).join(" ");
  const plzOrt = [postcode, city].filter(Boolean).join(" ");
  const label = [streetLine, plzOrt].filter(Boolean).join(", ") || display;
  const address = [streetLine, plzOrt, "Deutschland"].filter(Boolean).join(", ");
  return { label, address: address || display };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 3) {
      return NextResponse.json([]);
    }

    const { apiKey } = getOpenRouteServiceConfig();
    const res = await orsGet(apiKey, "/geocode/autocomplete", {
      text: q,
      size: "8",
      "boundary.country": "DE",
      layers: "address,street,venue,locality",
    });
    if (!res.ok) {
      const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
      nomUrl.searchParams.set("q", q);
      nomUrl.searchParams.set("format", "jsonv2");
      nomUrl.searchParams.set("countrycodes", "de");
      nomUrl.searchParams.set("limit", "5");
      nomUrl.searchParams.set("addressdetails", "1");
      const nomRes = await fetch(nomUrl.toString(), {
        cache: "no-store",
        headers: {
          "User-Agent": "bestellungformular-app/1.0 (server suggest fallback)",
          Accept: "application/json",
        },
      });
      if (!nomRes.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: `Autocomplete failed (${res.status}): ${err}` },
          { status: 502 }
        );
      }
      const rows = (await nomRes.json()) as NominatimSuggestion[];
      const items = rows
        .map(formatNominatimSuggestion)
        .filter((v): v is AddressSuggestion => v != null)
        .slice(0, 5);
      return NextResponse.json(items);
    }

    const json = (await res.json()) as { features?: OrsFeature[] };
    const seen = new Set<string>();
    const items: AddressSuggestion[] = [];

    for (const feature of json.features ?? []) {
      const props = feature.properties;
      if (!props) continue;
      const formatted = formatSuggestion(props);
      if (!formatted) continue;
      const key = `${formatted.label}|${formatted.address}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(formatted);
      if (items.length >= 5) break;
    }

    return NextResponse.json(items);
  } catch (e) {
    console.error("Anfahrtskosten suggest API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Suggestion request failed" },
      { status: 500 }
    );
  }
}
