import { NextResponse } from "next/server";
import { getOpenRouteServiceConfig } from "@/lib/config";

const ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search";
const ORS_DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car";

type GeocodeFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
};

async function geocodeAddress(address: string, apiKey: string): Promise<[number, number]> {
  const url = new URL(ORS_GEOCODE_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("text", address);
  url.searchParams.set("size", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }
  const json = (await res.json()) as { features?: GeocodeFeature[] };
  const coords = json.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length !== 2) {
    throw new Error(`Address not found: ${address}`);
  }
  return coords;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { origin?: string; destination?: string };
    const origin = (body.origin ?? "").trim();
    const destination = (body.destination ?? "").trim();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "origin and destination are required" },
        { status: 400 }
      );
    }

    const { apiKey } = getOpenRouteServiceConfig();
    const [originCoords, destinationCoords] = await Promise.all([
      geocodeAddress(origin, apiKey),
      geocodeAddress(destination, apiKey),
    ]);

    const routeRes = await fetch(ORS_DIRECTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [originCoords, destinationCoords],
      }),
      cache: "no-store",
    });

    if (!routeRes.ok) {
      const msg = await routeRes.text();
      return NextResponse.json(
        { error: `Route lookup failed (${routeRes.status}): ${msg}` },
        { status: 502 }
      );
    }

    const json = (await routeRes.json()) as {
      routes?: Array<{ summary?: { distance?: number } }>;
    };
    const meters = json.routes?.[0]?.summary?.distance;
    if (typeof meters !== "number") {
      return NextResponse.json(
        { error: "No route distance returned by provider" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      km: meters / 1000,
      kmRounded: Math.max(1, Math.min(1000, Math.round(meters / 1000))),
    });
  } catch (e) {
    console.error("Anfahrtskosten route API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Route request failed" },
      { status: 500 }
    );
  }
}
