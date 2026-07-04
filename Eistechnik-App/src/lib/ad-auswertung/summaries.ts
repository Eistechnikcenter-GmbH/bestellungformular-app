import { KALT_KONTAKT_TAG } from "./constants";
import type {
  CalculationIncludeOptions,
  ChannelSummary,
  InvoiceChannel,
  ProcessedInvoice,
  SourceSummary,
} from "./types";

function primarySourceTag(inv: ProcessedInvoice): string {
  if (inv.tags.length > 0) return inv.tags[0];
  if (inv.unmatched) return "Nicht zugeordnet";
  return KALT_KONTAKT_TAG;
}

/** Invoices included in KPIs, charts, and export totals. */
export function invoicesForCalculation(
  invoices: ProcessedInvoice[],
  options: CalculationIncludeOptions
): ProcessedInvoice[] {
  return invoices.filter((inv) => {
    if (inv.isEigenCompany && !options.includeEigenCompanies) return false;
    if (inv.isInKlaerung && !options.includeInKlaerung) return false;
    return true;
  });
}

export function buildSourceSummary(invoices: ProcessedInvoice[]): SourceSummary[] {
  const byTag = new Map<string, { invoices: ProcessedInvoice[]; customers: Set<number | string> }>();

  for (const inv of invoices) {
    const tag = primarySourceTag(inv);
    if (!byTag.has(tag)) {
      byTag.set(tag, { invoices: [], customers: new Set() });
    }
    const bucket = byTag.get(tag)!;
    bucket.invoices.push(inv);
    const customerKey = inv.endCustomerPartnerId ?? inv.endCustomerName;
    bucket.customers.add(customerKey);
  }

  return Array.from(byTag.entries())
    .map(([tag, data]) => ({
      tag,
      invoiceCount: data.invoices.length,
      customerCount: data.customers.size,
      revenueTotal: data.invoices.reduce((sum, i) => sum + i.amountTotal, 0),
      revenueUntaxed: data.invoices.reduce((sum, i) => sum + i.amountUntaxed, 0),
    }))
    .sort((a, b) => b.revenueTotal - a.revenueTotal);
}

export function buildChannelSummary(invoices: ProcessedInvoice[]): ChannelSummary[] {
  const channels: { key: InvoiceChannel; label: string }[] = [
    { key: "direct", label: "Direktzahlung" },
    { key: "agl", label: "AGL Leasing" },
  ];

  return channels.map(({ key, label }) => {
    const list = invoices.filter((i) => i.channel === key);
    const customers = new Set(
      list.map((i) => i.endCustomerPartnerId ?? i.endCustomerName)
    );
    return {
      channel: key,
      label,
      invoiceCount: list.length,
      customerCount: customers.size,
      revenueTotal: list.reduce((sum, i) => sum + i.amountTotal, 0),
      revenueUntaxed: list.reduce((sum, i) => sum + i.amountUntaxed, 0),
    };
  });
}
