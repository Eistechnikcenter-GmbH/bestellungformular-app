import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const base = {
    app: "ETC-App",
    timestamp: new Date().toISOString(),
    supabase: {
      urlConfigured: Boolean(supabaseUrl),
      anonKeyConfigured: Boolean(anonKey),
      serviceKeyConfigured: hasServiceKey,
      connected: false as boolean,
      region: "eu-central-1",
    },
  };

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ...base, ok: false, error: "Supabase env vars missing" },
      { status: 503 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (admin) {
    const { error } = await admin
      .from("app_connection_checks")
      .insert({ source: "etc-app-health-api" });

    if (!error) {
      return NextResponse.json({
        ...base,
        ok: true,
        supabase: { ...base.supabase, connected: true, writeTest: "ok" },
      });
    }

    return NextResponse.json(
      {
        ...base,
        ok: false,
        supabase: { ...base.supabase, connected: false, writeTest: error.message },
      },
      { status: 503 },
    );
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });

  return NextResponse.json({
    ...base,
    ok: res.ok,
    supabase: {
      ...base.supabase,
      connected: res.ok,
      writeTest: hasServiceKey ? "skipped" : "needs SUPABASE_SERVICE_ROLE_KEY",
    },
  });
}
