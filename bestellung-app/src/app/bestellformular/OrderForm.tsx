"use client";

import { useState } from "react";
import { BuyerSection, emptyBuyer, type BuyerData } from "./BuyerSection";
import type { CrmRow } from "@/lib/odoo-crm";

type Props = { leads: CrmRow[] };

export function OrderForm({ leads }: Props) {
  const [buyer, setBuyer] = useState<BuyerData>(emptyBuyer);

  return (
    <div className="rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
      <p className="mb-6 text-sm text-stone-600">
        Es wird hiermit nach Kenntnisnahme und Zugrundelegung der Geschäfts- und
        Lieferbedingungen des Verkäufers verbindlich bestellt:
      </p>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-bold text-stone-800">Verkäufer</h2>
        <div className="text-sm text-stone-700">
          <p>Eistechnikcenter GmbH</p>
          <p>14943 Luckenwalde</p>
          <p>Tel.: (03371) 68 97 940</p>
          <p>E-Mail: info@eistechnikcenter.de</p>
        </div>
      </section>

      <BuyerSection leads={leads} buyer={buyer} onBuyerChange={setBuyer} />
    </div>
  );
}
