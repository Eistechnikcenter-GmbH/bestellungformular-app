import { NextResponse } from "next/server";
import { getOpenRouteServiceConfig } from "@/lib/config";
import { geocodeAddress, orsPostJson } from "@/lib/openrouteservice";

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
      geocodeAddress(apiKey, origin),
      geocodeAddress(apiKey, destination),
    ]);

    const routeRes = await orsPostJson(apiKey, "/v2/directions/driving-car", {
      coordinates: [originCoords, destinationCoords],
    });

    if (!routeRes.ok) {
      const msg = (await routeRes.text()).slice(0, 300);
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
    const message = e instanceof Error ? e.message : "Route request failed";
    const status = message.includes("Missing required env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
