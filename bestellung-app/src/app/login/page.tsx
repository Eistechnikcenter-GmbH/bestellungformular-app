"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [require2FA, setRequire2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          totp: totp.trim(),
          redirect: from,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen.");
        if (data.require2FA) setRequire2FA(true);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-center text-lg font-semibold text-stone-800">
          Bestellung | Anmeldung
        </h1>
        <p className="mb-6 text-center text-sm text-stone-500">
          Eistechnikcenter
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              {error}
            </div>
          )}
          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-medium text-stone-600">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-stone-600">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              required
            />
          </div>
          {require2FA && (
            <div>
              <label htmlFor="totp" className="mb-1 block text-xs font-medium text-stone-600">
                2FA-Code (6 Ziffern)
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono tracking-widest focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                placeholder="000000"
                maxLength={6}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-stone-800 px-3 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Wird angemeldet…" : "Anmelden"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-stone-400">
          Session endet nach 2 Tagen ohne Nutzung.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-stone-100"><p className="text-stone-500">Wird geladen…</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
