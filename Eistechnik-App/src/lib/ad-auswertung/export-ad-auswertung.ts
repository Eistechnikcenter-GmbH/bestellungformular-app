import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { buildPieSlices, pieChartToDataUrl } from "./chart-utils";
import type { AdAuswertungResult, TagSource } from "./types";

function tagSourceLabel(source: TagSource): string {
  switch (source) {
    case "crm":
      return "CRM";
    case "contact":
      return "Kontakt-Stichwort";
    case "auto_kalt_kontakt":
      return "Automatisch (Kalt Kontakt)";
    default:
      return "—";
  }
}

function formatEur(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE");
}

export type ExportMeta = {
  dateFrom: string;
  dateTo: string;
  minAmount: number;
  tagFilter: string;
  channelFilter: string;
};

function filterLabel(meta: ExportMeta): string {
  const parts = [
    `${formatDate(meta.dateFrom)} – ${formatDate(meta.dateTo)}`,
    `Min. ${formatEur(meta.minAmount)}`,
  ];
  if (meta.tagFilter !== "all") parts.push(`Quelle: ${meta.tagFilter}`);
  if (meta.channelFilter !== "all") {
    parts.push(meta.channelFilter === "agl" ? "AGL Leasing" : "Direktzahlung");
  }
  return parts.join(" · ");
}

export function downloadAdAuswertungPdf(data: AdAuswertungResult, meta: ExportMeta): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Ad-Auswertung", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Eistechnikcenter GmbH — Umsatz nach Marketing-Quelle", margin, y);
  y += 5;
  doc.text(filterLabel(meta), margin, y);
  y += 4;
  doc.text(`Erstellt am ${new Date().toLocaleString("de-DE")}`, margin, y);
  y += 8;

  doc.setTextColor(0, 0, 0);
  const totalRevenue = data.sourceSummary.reduce((s, r) => s + r.revenueTotal, 0);
  const totalUntaxed = data.sourceSummary.reduce((s, r) => s + r.revenueUntaxed, 0);
  const uniqueCustomers = new Set(
    data.invoices.map((i) => i.endCustomerPartnerId ?? i.endCustomerName)
  ).size;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Kennzahlen", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const kpiLines = [
    `Rechnungen: ${data.invoices.length}`,
    `Umsatz brutto: ${formatEur(totalRevenue)}`,
    `Umsatz netto: ${formatEur(totalUntaxed)}`,
    `Endkunden: ${uniqueCustomers}`,
    `Quellen: ${data.sourceSummary.length}`,
  ];
  for (const line of kpiLines) {
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 4;

  const slices = buildPieSlices(data.sourceSummary);
  if (slices.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Umsatz nach Quelle", margin, y);
    y += 4;

    const chartUrl = pieChartToDataUrl(slices, 280);
    const chartSize = 52;
    if (chartUrl) {
      doc.addImage(chartUrl, "PNG", margin, y, chartSize, chartSize);
    }

    let legendY = y + 4;
    const legendX = margin + chartSize + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const slice of slices) {
      doc.setFillColor(slice.color);
      doc.rect(legendX, legendY - 2.5, 3, 3, "F");
      doc.text(
        `${slice.tag}: ${formatEur(slice.revenueTotal)} (${slice.percent.toFixed(1)}%)`,
        legendX + 5,
        legendY
      );
      legendY += 5;
    }
    y = Math.max(y + chartSize + 6, legendY + 2);
  }

  if (data.channelSummary.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Zahlungsweg", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Weg", "Rechnungen", "Kunden", "Brutto", "Netto"]],
      body: data.channelSummary.map((ch) => [
        ch.label,
        String(ch.invoiceCount),
        String(ch.customerCount),
        formatEur(ch.revenueTotal),
        formatEur(ch.revenueUntaxed),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 41, 41], textColor: 255 },
      theme: "grid",
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (data.sourceSummary.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Quellen-Übersicht", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Quelle", "Rechnungen", "Kunden", "Brutto", "Netto"]],
      body: data.sourceSummary.map((row) => [
        row.tag,
        String(row.invoiceCount),
        String(row.customerCount),
        formatEur(row.revenueTotal),
        formatEur(row.revenueUntaxed),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 41, 41], textColor: 255 },
      theme: "grid",
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  doc.addPage();
  y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Rechnungen (${data.invoices.length})`, margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      ["Rechnung", "Datum", "Status", "Weg", "Endkunde", "Quelle", "Netto", "MwSt.", "Brutto"],
    ],
    body: data.invoices.map((inv) => [
      inv.number,
      formatDate(inv.invoiceDate),
      inv.statusLabel,
      inv.channel === "agl" ? "AGL" : "Direkt",
      inv.endCustomerName,
      inv.tags.join(", ") || "—",
      formatEur(inv.amountUntaxed),
      formatEur(inv.taxAmount),
      formatEur(inv.amountTotal),
    ]),
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [41, 41, 41], textColor: 255, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 18 },
      4: { cellWidth: 32 },
      5: { cellWidth: 28 },
    },
    theme: "grid",
  });

  const filename = `Ad-Auswertung_${meta.dateFrom}_${meta.dateTo}.pdf`;
  doc.save(filename);
}

function csvCell(value: string | number): string {
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function formatEurCsv(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/** Excel-compatible CSV (semicolon, German number format). */
export function downloadAdAuswertungExcel(data: AdAuswertungResult, meta: ExportMeta): void {
  const lines: string[] = [];
  const sep = ";";

  lines.push(
    [
      "Ad-Auswertung",
      filterLabel(meta),
      `Erstellt: ${new Date().toLocaleString("de-DE")}`,
    ]
      .map(csvCell)
      .join(sep)
  );
  lines.push("");

  lines.push(
    [
      "Rechnung",
      "Datum",
      "Status",
      "Zahlungsweg",
      "Rechnungsempfänger",
      "Endkunde",
      "Leasing-Kunde",
      "Quelle (Tags)",
      "Quellen-Herkunft",
      "Netto (EUR)",
      "MwSt. (EUR)",
      "Brutto (EUR)",
    ].join(sep)
  );

  for (const inv of data.invoices) {
    lines.push(
      [
        csvCell(inv.number),
        csvCell(formatDate(inv.invoiceDate)),
        csvCell(inv.statusLabel),
        csvCell(inv.channel === "agl" ? "AGL Leasing" : "Direktzahlung"),
        csvCell(inv.invoicePartnerName),
        csvCell(inv.endCustomerName),
        csvCell(inv.leasingKunde ?? ""),
        csvCell(inv.tags.join(", ")),
        csvCell(tagSourceLabel(inv.tagSource)),
        formatEurCsv(inv.amountUntaxed),
        formatEurCsv(inv.taxAmount),
        formatEurCsv(inv.amountTotal),
      ].join(sep)
    );
  }

  lines.push("");
  lines.push(["Quellen-Übersicht"].map(csvCell).join(sep));
  lines.push(["Quelle", "Rechnungen", "Kunden", "Brutto (EUR)", "Netto (EUR)"].join(sep));
  for (const row of data.sourceSummary) {
    lines.push(
      [
        csvCell(row.tag),
        row.invoiceCount,
        row.customerCount,
        formatEurCsv(row.revenueTotal),
        formatEurCsv(row.revenueUntaxed),
      ].join(sep)
    );
  }

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ad-Auswertung_${meta.dateFrom}_${meta.dateTo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
