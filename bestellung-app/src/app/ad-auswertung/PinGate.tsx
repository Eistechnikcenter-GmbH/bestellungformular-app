"use client";

import { useState } from "react";

export function PinGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ad-auswertung/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Falscher PIN");
        return;
      }
      onUnlocked();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-stone-800">PIN eingeben</h2>
      <p className="mb-4 text-sm text-stone-600">
        Diese Auswertung ist zusätzlich geschützt.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ad-pin" className="mb-1 block text-xs font-medium text-stone-600">
            PIN
          </label>
          <input
            id="ad-pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800"
            autoComplete="off"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !pin}
          className="w-full rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "Prüfe…" : "Freischalten"}
        </button>
      </form>
    </div>
  );
}
