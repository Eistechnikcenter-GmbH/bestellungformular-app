/**
 * Bestellung (order form) PDF export.
 * Separate file so you can manually choose and adjust layout/fields without touching the rest of the app.
 *
 * Usage: call buildBestellungPdf(data) from an API route or server action when generating or emailing the order PDF.
 */

export type BestellungPdfData = {
  /** Käufer / business address */
  firma?: string;
  name?: string;
  vorname?: string;
  plzOrt?: string;
  strasseHausnummer?: string;
  telefon?: string;
  email?: string;
  /** Lieferadresse */
  lieferPlzOrt?: string;
  lieferStrasse?: string;
  lieferTelefon?: string;
  /** Order lines: Stück, Artikel, Netto, MwSt., Brutto */
  lines?: Array<{
    menge: number;
    artikel: string;
    netto: number;
    mwst: number;
    brutto: number;
  }>;
  /** Optional: delivery wish, date, etc. */
  lieferwunsch?: string;
  gewuenschterTermin?: string;
  [key: string]: unknown;
};

/**
 * Build PDF buffer for the Bestellung form.
 * Replace this with your actual PDF library (e.g. @react-pdf/renderer, pdf-lib, puppeteer) and layout.
 */
export async function buildBestellungPdf(
  _data: BestellungPdfData
): Promise<Buffer> {
  // TODO: integrate PDF library and fill layout from _data
  // For now return empty buffer so the structure is in place and you can plug in your choice
  return Buffer.from("");
}
