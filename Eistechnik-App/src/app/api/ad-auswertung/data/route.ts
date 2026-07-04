import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchAdAuswertung } from "@/lib/ad-auswertung/fetch-ad-auswertung";
import type { AdAuswertungFilters } from "@/lib/ad-auswertung/types";
import { getAdPinCookieName, verifyAdPinToken } from "@/lib/auth/ad-pin";

function parseFilters(url: URL): AdAuswertungFilters | { error: string } {
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  if (!dateFrom || !dateTo) {
    return { error: "dateFrom und dateTo sind erforderlich" };
  }

  const minAmountRaw = url.searchParams.get("minAmount");
  const minAmount = minAmountRaw != null ? Number(minAmountRaw) : 0;
  if (Number.isNaN(minAmount) || minAmount < 0) {
    return { error: "minAmount muss eine Zahl >= 0 sein" };
  }

  const tagParam = url.searchParams.get("tag");
  const tagFilter = tagParam && tagParam !== "all" ? tagParam : null;

  const channelParam = url.searchParams.get("channel");
  const channelFilter =
    channelParam === "agl" || channelParam === "direct" ? channelParam : "all";

  return { dateFrom, dateTo, minAmount, tagFilter, channelFilter };
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdPinCookieName())?.value;
  if (!verifyAdPinToken(token)) {
    return NextResponse.json({ error: "PIN erforderlich" }, { status: 401 });
  }

  const filters = parseFilters(new URL(request.url));
  if ("error" in filters) {
    return NextResponse.json({ error: filters.error }, { status: 400 });
  }

  try {
    const data = await fetchAdAuswertung(filters);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
