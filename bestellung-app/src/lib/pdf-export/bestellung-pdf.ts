/**
 * Bestellung (order form) PDF export.
 * Separate file so you can manually choose and adjust layout/fields without touching the rest of the app.
 *
 * Page 1: Contract (header, Verkäufer, Käufer, Lieferadresse, order table, delivery, clauses, Optionen, signatures, Widerruf).
 * Page 2: AGB (Allgemeine Geschäfts- und Lieferbedingungen) in two columns.
 *
 * Usage: call downloadBestellungPdf(data) from the form (e.g. Export PDF button).
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const FONT_SIZE = 7;
const HEADER_FONT_SIZE = 8;
const SMALL = 6;
/** Page 2 AGB: body font size in pt – kleiner = weniger Platz, mehr Text pro Seite */
const AGB_BODY_SIZE = 6;
/** Abstand zwischen den zwei AGB-Spalten (mm). Kleiner = breitere Textblöcke, mehr Text pro Zeile. */
const AGB_COLUMN_GAP = 6;
const AGB_LINE_HEIGHT = 3.2;
const AGB_TITLE_TO_BODY = 3;
const AGB_BLOCK_GAP = 4;
const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

/** Header SVG aspect (viewBox): width 678, height ~62.25 → height in mm for 210mm width */
const HEADER_HEIGHT_MM = (62.25 / 678) * PAGE_WIDTH;
/** Footer SVG aspect: width 678, height 11.25 */
const FOOTER_HEIGHT_MM = (11.25 / 678) * PAGE_WIDTH;
/** Bleed (mm) so header/footer images extend past left/right edges and clip flush. */
const HEADER_FOOTER_BLEED_MM = 4;
/** Small bottom bleed (mm) so footer bar clips flush with sheet bottom without adding visible thickness. */
const FOOTER_BOTTOM_BLEED_MM = 0.5;

/** Height in mm for the "In Vertretung Verkäufer" signature image in the footer. Width is computed from the image’s aspect ratio so it’s never stretched. */
const VERKAUFER_SIGNATURE_HEIGHT_MM = 25;
/** X position (mm from left edge of page) for the left edge of the signature image. */
const VERKAUFER_SIGNATURE_X_MM = 75;
/** Gap (mm) between the bottom of the signature image and the "In Vertretung Verkäufer" horizontal line. Increase to move the image up. */
const VERKAUFER_SIGNATURE_Y_GAP_ABOVE_LINE_MM = -6;

// ----- Yellow signature cross (cross.svg): one size, three positions -----
/** Size (mm) of the yellow cross. 1:1 ratio – only change this, height follows. */
const SIGN_CROSS_SIZE_MM = 11;
/** Cross 1: left of "Unterschrift Kunde" (x in mm from left edge). */
const CROSS1_X_MM = 99;
/** Cross 1: y offset (mm) from the signature line; 0 = centered on line. */
const CROSS1_Y_OFFSET_MM = 3;
/** Cross 2: left of "In Vertretung Verkäufer" (x in mm). */
const CROSS2_X_MM = 125;
const CROSS2_Y_OFFSET_MM = -5;
/** Cross 3 (page 2): left of "Datum / Unterschrift" AGB signature (x in mm). */
const CROSS3_X_MM = 132;
const CROSS3_Y_OFFSET_MM = -5;

/** Scale factor for SVG→PNG conversion (higher = sharper header/footer, less pixelation). */
const SVG_TO_PNG_SCALE = 3;

/**
 * Load SVG from URL and convert to PNG data URL (browser only).
 * - Default: SVG_TO_PNG_SCALE × natural size (for header/footer).
 * - If maxSizePx is set, rasterize at that max width/height to keep file small (e.g. for cross icon).
 */
async function svgUrlToPngDataUrl(url: string, maxSizePx?: number): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load SVG: ${url}`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let w = img.naturalWidth * SVG_TO_PNG_SCALE;
        let h = img.naturalHeight * SVG_TO_PNG_SCALE;
        if (maxSizePx != null && (w > maxSizePx || h > maxSizePx)) {
          const r = Math.min(maxSizePx / w, maxSizePx / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2d not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(blobUrl);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = blobUrl;
  });
}

let cachedImages: Page1Images | null = null;

/** Poppins font base64 (cached after first load). */
let cachedPoppins: { normal: string; bold: string } | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return typeof btoa !== "undefined" ? btoa(binary) : "";
}

/**
 * Load Poppins font files and return base64 (browser only). Cached after first load.
 */
export async function loadPoppinsFonts(): Promise<{ normal: string; bold: string }> {
  if (cachedPoppins) return cachedPoppins;
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return { normal: "", bold: "" };
  }
  const base = window.location.origin;
  const [regularRes, boldRes] = await Promise.all([
    fetch(`${base}/fonts/Poppins-Regular.ttf`),
    fetch(`${base}/fonts/Poppins-Bold.ttf`),
  ]);
  if (!regularRes.ok || !boldRes.ok) return { normal: "", bold: "" };
  const [regularBuf, boldBuf] = await Promise.all([
    regularRes.arrayBuffer(),
    boldRes.arrayBuffer(),
  ]);
  cachedPoppins = {
    normal: arrayBufferToBase64(regularBuf),
    bold: arrayBufferToBase64(boldBuf),
  };
  return cachedPoppins;
}

/**
 * Register Poppins with a jsPDF instance. Call after creating the doc and before drawing.
 */
export function registerPoppinsInDoc(
  doc: jsPDF,
  fonts: { normal: string; bold: string }
): void {
  if (!fonts.normal || !fonts.bold) return;
  doc.addFileToVFS("Poppins-Regular.ttf", fonts.normal);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFileToVFS("Poppins-Bold.ttf", fonts.bold);
  doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
}

/**
 * Load header/footer SVGs and convert to PNG data URLs (browser only).
 * Result is cached so preview and download can reuse without refetching.
 */
export async function loadHeaderFooterImages(): Promise<Page1Images> {
  if (cachedImages?.headerDataUrl && cachedImages?.footerDataUrl) return cachedImages;
  if (typeof window === "undefined" || typeof fetch === "undefined") return {};
  try {
    const base = window.location.origin;
    const [headerDataUrl, footerDataUrl, crossDataUrl] = await Promise.all([
      svgUrlToPngDataUrl(`${base}/images/bestellung-header.svg`),
      svgUrlToPngDataUrl(`${base}/images/bestellung-footer.svg`),
      // Cross is small on page; cap size so PDF stays small (cross.svg can contain huge embedded images).
      svgUrlToPngDataUrl(`${base}/signing/cross.svg`, 200).catch(() => undefined),
    ]);
    cachedImages = { headerDataUrl, footerDataUrl, crossDataUrl };
    return cachedImages;
  } catch {
    return {};
  }
}

export type BestellungPdfData = {
  /** Käufer / Geschäftsadresse */
  firma?: string;
  seit?: string;
  branche?: string;
  name?: string;
  vorname?: string;
  gebDatum?: string;
  plzOrt?: string;
  strasseHausnummer?: string;
  adresszusatz?: string;
  telefon?: string;
  mobil?: string;
  email?: string;
  /** Lieferadresse */
  lieferPlzOrt?: string;
  lieferStrasse?: string;
  lieferTelefon?: string;
  /** Order lines */
  lines?: Array<{
    stueck: number;
    artikel: string;
    netto: string;
    mwst: number;
    brutto: number;
  }>;
  /** Delivery / Ruhetage */
  liefertermin?: string;
  ruhetage?: string;
  /** Optionen (3 lines) */
  option1?: string;
  option2?: string;
  option3?: string;
  /** Datum DD.MM.YYYY */
  datum?: string;
  /** Data URL of selected Verkäufer signature image (for "In Vertretung Verkäufer" in footer). */
  verkauferSignatureDataUrl?: string;
  /** Intrinsic pixel size of the signature image (so PDF can preserve aspect ratio and avoid stretch). */
  verkauferSignatureWidth?: number;
  verkauferSignatureHeight?: number;
  [key: string]: unknown;
};

function line(doc: jsPDF, y: number, x1: number, x2: number) {
  doc.setDrawColor(120, 120, 120);
  doc.line(x1, y, x2, y);
}

export type Page1Images = {
  headerDataUrl?: string;
  footerDataUrl?: string;
  /** Yellow cross (cross.svg) for signature placeholders. */
  crossDataUrl?: string;
};

const PDF_FONT = "Poppins" as const;
const PDF_FONT_FALLBACK = "helvetica" as const;

function drawPage1(
  doc: jsPDF,
  data: BestellungPdfData,
  font: "Poppins" | "helvetica" = PDF_FONT_FALLBACK,
  images?: Page1Images
) {
  let y = 10;

  // Header: use high-res PNG (from SVG), drawn with bleed so it’s flush with top/left/right
  if (images?.headerDataUrl) {
    doc.addImage(
      images.headerDataUrl,
      "PNG",
      -HEADER_FOOTER_BLEED_MM,
      0,
      PAGE_WIDTH + 2 * HEADER_FOOTER_BLEED_MM,
      HEADER_HEIGHT_MM + HEADER_FOOTER_BLEED_MM
    );
    y = HEADER_HEIGHT_MM + 4;
  } else {
    doc.setFillColor(229, 229, 229);
    doc.rect(0, 0, PAGE_WIDTH, 6, "F");
    doc.setFillColor(139, 46, 46);
    doc.rect(0, 6, PAGE_WIDTH, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("E/C", PAGE_WIDTH - MARGIN, 16);
    doc.setFontSize(8);
    doc.text("Eistechnikcenter", PAGE_WIDTH - MARGIN, 19);
    doc.setTextColor(0, 0, 0);
    y = 22;
  }
  doc.setFontSize(SMALL);
  doc.text(
    "Es wird hiermit nach Kenntnisnahme und Zugrundelegung der Geschäfts- und Lieferbedingungen des Verkäufers verbindlich bestellt:",
    MARGIN,
    15
  );

  // Verkäufer
  doc.setFont(font, "bold");
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text("Verkäufer", MARGIN, y);
  y += 4;
  doc.setFont(font, "normal");
  doc.setFontSize(SMALL);
  doc.text("Eistechnikcenter GmbH", MARGIN, y);
  y += 3.5;
  doc.text("14943 Luckenwalde", MARGIN, y);
  y += 3.5;
  doc.text("Tel.: (03371) 68 97 940", MARGIN, y);
  y += 3.5;
  doc.text("E-Mail: info@eistechnikcenter.de", MARGIN, y);
  y += 7;

  // Käufer / Geschäftsadresse
  doc.setFont(font, "bold");
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text("Käufer", MARGIN, y);
  y += 3.5;
  doc.setFont(font, "normal");
  doc.setFontSize(SMALL);
  doc.text("Geschäftsadresse", MARGIN, y);
  y += 5;

  const col1X = MARGIN;
  const col2X =110;
  const labelW = 25;
  const fieldW = 60;
  const rowH = 4;

  const leftLabels = ["Firma", "Name", "PLZ & Ort", "Telefon", "E-Mail Adresse"];
  const leftKeys = ["firma", "name", "plzOrt", "telefon", "email"] as const;
  const rightLabels = ["seit", "Vorname", "Straße & Hausnummer", "Mobil", "Branche", "Geb.-Datum"];
  const rightKeys = ["seit", "vorname", "strasseHausnummer", "mobil", "branche", "gebDatum"] as const;

  for (let i = 0; i < Math.max(leftLabels.length, rightLabels.length); i++) {
    if (i < leftLabels.length) {
      doc.setFontSize(SMALL);
      doc.text(leftLabels[i], col1X, y);
      doc.text(String(data[leftKeys[i]] ?? ""), col1X + labelW, y);
      line(doc, y + 1, col1X + labelW, col1X + labelW + fieldW);
    }
    if (i < rightLabels.length) {
      doc.text(rightLabels[i], col2X, y);
      doc.text(String(data[rightKeys[i]] ?? ""), col2X + labelW, y);
      line(doc, y + 1, col2X + labelW, col2X + labelW + fieldW);
    }
    y += rowH;
  }

  // y += 0;
  doc.setFont(font, "bold");
  doc.text("Lieferadresse", MARGIN, y);
  y += 4;
  doc.setFont(font, "normal");
  doc.setFontSize(SMALL);
  doc.text("PLZ & Ort", col1X, y);
  doc.text(String(data.lieferPlzOrt ?? ""), col1X + labelW, y);
  line(doc, y + 1, col1X + labelW, col1X + labelW + fieldW);
  doc.text("Straße & Hausnummer", col2X, y);
  doc.text(String(data.lieferStrasse ?? ""), col2X + labelW, y);
  line(doc, y + 1, col2X + labelW, col2X + labelW + fieldW);
  y += rowH;
  doc.text("Telefon", col1X, y);
  doc.text(String(data.lieferTelefon ?? ""), col1X + labelW, y);
  line(doc, y + 1, col1X + labelW, col1X + labelW + fieldW);
  y += 10;

  // Order table
  doc.setFontSize(FONT_SIZE);
  const tableData = (data.lines ?? []).map((row) => [
    String(row.stueck ?? ""),
    row.artikel ?? "",
    row.netto ?? "",
    row.mwst != null ? `${row.mwst} %` : "",
    row.brutto > 0 ? row.brutto.toFixed(2) : "",
  ]);
  if (tableData.length === 0) tableData.push(["", "", "", "", ""]);

  autoTable(doc, {
    startY: y,
    head: [["Stück", "Artikel", "Netto-Preis in EUR", "MwSt.", "Brutto-Preis in EUR"]],
    body: tableData,
    margin: { left: MARGIN },
    theme: "plain",
    headStyles: { fillColor: [245, 245, 245], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 60 },
      2: { cellWidth: 38 },
      3: { cellWidth: 22 },
      4: { cellWidth: 38 },
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Delivery
  doc.setFontSize(SMALL);
  doc.text("Unverbindlicher gewünschter Liefertermin", MARGIN, y);
  doc.text(String(data.liefertermin ?? "schnellstmöglich"), MARGIN + 48, y);
  line(doc, y + 1, MARGIN + 46, MARGIN + 70);
  doc.text("Ruhetage des Unternehmens", 147, y);
  doc.text(String(data.ruhetage ?? "-"), 125 + 40, y);
  line(doc, y + 1, 180, PAGE_WIDTH - MARGIN);
  y += 12;

  // Contract clauses
  doc.setFontSize(SMALL);
  doc.text(
    "Sollte dieser Vertrag einen anderen, früheren Vertrag ersetzen, so tritt der frühere abgeschlossene Vertrag bei Widerruf dieses Vertrages wieder in Kraft.",
    MARGIN,
    y,
    { maxWidth: PAGE_WIDTH - 2 * MARGIN }
  );
  y += 3;
  doc.text(
    "Der Käufer hat die Geschäfts- und Lieferbedingungen des Verkäufers zur Kenntnis genommen und erkennt diese als Bestandteil des Vertrages an.",
    MARGIN,
    y,
    { maxWidth: PAGE_WIDTH - 2 * MARGIN }
  );
  y += 3;
  doc.text(
    "Zum Zwecke der Vertragsabwicklung werden personenbezogene Daten des Käufers beim Verkäufer gespeichert.",
    MARGIN,
    y,
    { maxWidth: PAGE_WIDTH - 2 * MARGIN }
  );
  y += 6;

  // Optionen
  doc.setFont(font, "bold");
  doc.text("Optionen:", MARGIN, y);
  y += 4;
  doc.setFont(font, "normal");
  doc.text("Mietkauf / Leasing bei entsprechender Bonität auf Wunsch des Kunden möglich.", MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 3;
  doc.text("Zahlungsbedingungen: zahlbar vor Lieferung, Leasing bei entsprechender Bonität möglich.", MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 3;
  doc.text("Zzgl. Anlieferung, ebenerdiger Einbringung, Aufstellung, Inbetriebnahme, Funktionskontrolle und Einweisung beim Kunden vor Ort.", MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 6;
  doc.setFont(font, "bold");
  doc.text(data.option1 ?? "• Pauschale € 380,-  (Lieferkosten, Inbetriebnahme, Einarbeitung)", MARGIN, y);
  y += 3;
  doc.text(data.option2 ?? "* 3 Monate mietfreie Startphase", MARGIN, y);
  y += 3;
  doc.text(data.option3 ?? "• 1 Starterpaket für 1000 Eis inkl. Becher / Waffeln kostenlos", MARGIN, y, { maxWidth: PAGE_WIDTH - 2 * MARGIN });
  y += 9;
  doc.setFont(font, "normal");

  // Agreements – light grey background box (as in second screenshot)
  const agreementsBoxTop = y -  5;
  const agreementsBoxHeight = 16;
  const boxabstand = 3;
  doc.setFillColor(235, 235, 235);
  doc.rect(MARGIN, agreementsBoxTop, PAGE_WIDTH - 2 * MARGIN, agreementsBoxHeight, "F");

  doc.text("Es bestehen keine mündlichen Nebenabreden / Vereinbarungen.", MARGIN+boxabstand, y);
  const unterschriftKundeLineY = y;
  line(doc, y+boxabstand, 110, PAGE_WIDTH - MARGIN-boxabstand);
  doc.setFontSize(SMALL);
  doc.text("Unterschrift Kunde", 110, y + 8);
  y += 5;
  doc.text("Kunde stimmt Bonitätsprüfung (Crefo/Schufa) zu.", MARGIN+boxabstand, y);
  // y += 10;

  y += 14;

  // Widerrufsbelehrung: box with 1px border, margin +5 left, -5 right (as in screenshot)
  const WIDERRUFS_BOX_LEFT = MARGIN + boxabstand;
  const WIDERRUFS_BOX_WIDTH = PAGE_WIDTH - 2 * MARGIN - 2*boxabstand; // +5 left, -5 right
  const widerrufsBoxTop = y - 1;

  doc.setFont(font, "bold");
  doc.setFontSize(FONT_SIZE);
  doc.text("Widerrufsbelehrung:", WIDERRUFS_BOX_LEFT, y);
  y += 4;
  doc.setFont(font, "normal");
  doc.setFontSize(SMALL);
  doc.text(
    "Widerrufsrecht: Verbraucher i.Sinne von §13 BGB können ihre Vertragserklärung innerhalb von 2 Wochen ohne Angabe von Gründen in Textform oder durch Rücksendung der Ware widerrufen. Die Frist beginnt frühestens mit Erhalt dieser Belehrung. Zur Wahrung der Widerrufsfrist genügt die rechtzeitige Absendung des Widerrufs, oder der Sache. Der Widerruf ist an den Verkäufer zu richten.",
    WIDERRUFS_BOX_LEFT,
    y,
    { maxWidth: WIDERRUFS_BOX_WIDTH }
  );
  y += 10;
  doc.setFont(font, "bold");
  doc.text("Widerrufsfolgen:", WIDERRUFS_BOX_LEFT, y);
  y += 4;
  doc.setFont(font, "normal");
  doc.text(
    "Im Falle eines wirksamen Widerrufs sind die beiderseits empfangenen Leistungen zurückzugewähren und ggf. gezogene Nutzungen herauszugeben. Kann der Käufer die empfangenen Leistungen ganz oder teilweise nicht oder nur in verschlechtertem Zustand zurückgewähren, muss der Käufer in soweit ggf. Wertersatz leisten. Bei der Überlassung von Sachen gilt dies nicht, wenn die Verschlechterung der Sache ausschließlich auf deren Prüfung, wie sie dem Käufer etwa im Ladengeschäft möglich gewesen wäre, zurückzuführen ist. Im Übrigen kann der Käufer die Wertersatzpflicht vermeiden, indem er die Sache nicht wie ein Eigentümer im Gebrauch nimmt und alles unterlässt, was deren Wert beeinträchtigt. Paketversandfertige Sachen sind auf unsere Kosten und Gefahr zurückzusenden.",
    WIDERRUFS_BOX_LEFT,
    y,
    { maxWidth: WIDERRUFS_BOX_WIDTH }
  );
  y += 10;

  // 1px border around Widerrufsbelehrung block
  const widerrufsBoxHeight = y - widerrufsBoxTop + 2*boxabstand;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35); // ~1px in mm
  doc.rect(WIDERRUFS_BOX_LEFT-boxabstand, widerrufsBoxTop-boxabstand, WIDERRUFS_BOX_WIDTH+2*boxabstand, widerrufsBoxHeight, "S");
  doc.setLineWidth(0.2); // reset for other lines

  // Footer: optional footer SVG, then signature line and labels
  const footerY = PAGE_HEIGHT - FOOTER_HEIGHT_MM - 18;
  if (y > footerY) y = footerY;
  if (images?.footerDataUrl) {
    doc.addImage(
      images.footerDataUrl,
      "PNG",
      -HEADER_FOOTER_BLEED_MM,
      PAGE_HEIGHT - FOOTER_HEIGHT_MM - FOOTER_BOTTOM_BLEED_MM,
      PAGE_WIDTH + 2 * HEADER_FOOTER_BLEED_MM,
      FOOTER_HEIGHT_MM + FOOTER_BOTTOM_BLEED_MM
    );
  }
  if (!images?.footerDataUrl) {
    line(doc, PAGE_HEIGHT - 12, MARGIN, PAGE_WIDTH - MARGIN);
  }
  const footersize = 15
  const DatumfooterlineStart = MARGIN;
  const DatumfooterlineEnd = MARGIN+50;
  const InVertretungfooterlineStart = MARGIN+60;
  const InVertretungfooterlineEnd = MARGIN+110;
  const VerbindlicheBestellungfooterlineStart = MARGIN+120;
  const VerbindlicheBestellungfooterlineEnd = PAGE_WIDTH - MARGIN;
  
  doc.text(data.datum ?? formatToday(), MARGIN, PAGE_HEIGHT - footersize);
  doc.setFontSize(SMALL);
  doc.text("Datum", MARGIN, PAGE_HEIGHT - footersize+4);
  line(doc, PAGE_HEIGHT - footersize+1, DatumfooterlineStart, DatumfooterlineEnd);
  // "In Vertretung Verkäufer": optional signature image above label, then label, then line
  // Position/size: VERKAUFER_SIGNATURE_X_MM, VERKAUFER_SIGNATURE_Y_GAP_ABOVE_LINE_MM, VERKAUFER_SIGNATURE_HEIGHT_MM (top of file).
  const inVertretungLineY = PAGE_HEIGHT - footersize + 1;
  const sigImgH = VERKAUFER_SIGNATURE_HEIGHT_MM;
  const aspect =
    data.verkauferSignatureWidth != null &&
    data.verkauferSignatureHeight != null &&
    data.verkauferSignatureHeight > 0
      ? data.verkauferSignatureWidth / data.verkauferSignatureHeight
      : 4;
  const sigImgW = sigImgH * aspect;
  const sigImgX = VERKAUFER_SIGNATURE_X_MM;
  const sigImgY = inVertretungLineY - sigImgH - VERKAUFER_SIGNATURE_Y_GAP_ABOVE_LINE_MM;
  if (data.verkauferSignatureDataUrl) {
    try {
      doc.addImage(
        data.verkauferSignatureDataUrl,
        "PNG",
        sigImgX,
        sigImgY,
        sigImgW,
        sigImgH
      );
    } catch {
      // fallback if image invalid
    }
  }
  doc.text("In Vertretung Verkäufer", InVertretungfooterlineStart, PAGE_HEIGHT - footersize + 4);
  line(doc, inVertretungLineY, InVertretungfooterlineStart, InVertretungfooterlineEnd);
  doc.text("Verbindliche Bestellung des Käufers", VerbindlicheBestellungfooterlineStart, PAGE_HEIGHT - footersize+4);
  doc.text("Unterschrift / Stempel", VerbindlicheBestellungfooterlineStart, PAGE_HEIGHT - footersize+7);
  line(doc, PAGE_HEIGHT - footersize+1, VerbindlicheBestellungfooterlineStart, VerbindlicheBestellungfooterlineEnd);

  // Yellow signature crosses 1 & 2 (cross 3 is on page 2 at AGB "Datum / Unterschrift")
  if (images?.crossDataUrl) {
    const s = SIGN_CROSS_SIZE_MM;
    const crossY1 = unterschriftKundeLineY - s / 2 + CROSS1_Y_OFFSET_MM;
    const crossY2 = inVertretungLineY - s / 2 + CROSS2_Y_OFFSET_MM;
    try {
      doc.addImage(images.crossDataUrl, "PNG", CROSS1_X_MM, crossY1, s, s);
      doc.addImage(images.crossDataUrl, "PNG", CROSS2_X_MM, crossY2, s, s);
    } catch {
      // ignore if cross image invalid
    }
  }
}

function formatToday(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Justify a single line so it fills colWidth (Blockformat: rechter Rand bündig).
 * Always adds space between words when possible so the line gets closer to colWidth.
 */
function justifyLine(doc: jsPDF, line: string, colWidth: number): string {
  const words = line.trim().split(/\s+/);
  if (words.length <= 1) return line;
  const currentWidth = doc.getTextWidth(line);
  if (currentWidth >= colWidth) return line;
  const spaceWidth = doc.getTextWidth(" ");
  if (spaceWidth <= 0) return line;
  const extraWidth = colWidth - currentWidth;
  const numGaps = words.length - 1;
  const extraSpacesTotal = extraWidth / spaceWidth;
  const baseExtra = Math.floor(extraSpacesTotal / numGaps);
  const remainder = Math.round(extraSpacesTotal - baseExtra * numGaps);
  let result = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const spaces = 1 + baseExtra + (i <= remainder ? 1 : 0);
    result += " ".repeat(spaces) + words[i];
  }
  return result;
}

/**
 * Draw a text block with justified lines (Blockformat). Last line stays left-aligned.
 * Every non-last line is word-justified and then stretched to colWidth via charSpace (straight right edge).
 */
function drawJustifiedBlock(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  colWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, colWidth);
  for (let i = 0; i < lines.length; i++) {
    const isLastLine = i === lines.length - 1;
    const rawLine = lines[i]!;
    const line = isLastLine ? rawLine : justifyLine(doc, rawLine, colWidth);
    const lineWidth = doc.getTextWidth(line);
    const numGaps = line.length - 1;
    const needsStretch =
      !isLastLine &&
      numGaps > 0 &&
      lineWidth > 0 &&
      lineWidth < colWidth - 0.001;
    const charSpace = needsStretch ? (colWidth - lineWidth) / numGaps : 0;
    doc.text(line, x, y + i * lineHeight, { charSpace });
  }
  return y + lines.length * lineHeight;
}

// ========== Page 2 AGB – Nur Text, Abstände unten manuell einstellbar ==========
// Überschrift
const AGB_PAGE_TITLE = "Allgemeine Geschäfts- und Lieferbedingungen";
// Linke Spalte (§ 1–5)
const AGB_1_TITLE = "§ 1. Allgemeine Bestimmungen";
const AGB_1_TEXT =
  "1) Die Lieferungen, Leistungen und Angebote des Verkäufers erfolgen ausschließlich aufgrund dieser Geschäftsbedingungen. Entgegenstehende Geschäftsbedingungen des Vertragspartners sind für den Verkäufer nur bindend, wenn diese ausdrücklich schriftlich anerkannt werden. 2) Im Übrigen sind entgegenstehende Geschäftsbedingungen dem Verkäufer gegenüber rechtsunwirksam, ohne dass es eines ausdrücklichen Widerspruches des Verkäufers hiergegen bedarf. Gegenbestätigungen des Käufers unter Hinweis auf seine allgemeinen Geschäftsbedingungen wird hiermit ausdrücklich widersprochen. 3) Alle Abweichungen von diesen Geschäftsbedingungen bedürfen der schriftlichen Bestätigung durch den Verkäufer. Von diesem Schriftformerfordernis kann nur aufgrund schriftlicher Vereinbarung zwischen dem Käufer und dem Verkäufer abgewichen werden. 4) Sollte eine Bestimmung in diesen Geschäftsbedingungen oder eine Bestimmung im Rahmen sonstiger Vereinbarungen unwirksam sein oder werden, so wird hiervon die Wirksamkeit aller sonstigen Bestimmungen oder Vereinbarungen nicht berührt. 5) Die Rechtsbeziehungen zwischen dem Verkäufer und dem Käufer unterliegen dem Recht der Bundesrepublik Deutschland unter Ausschluss des Kollisionsrechts.";
const AGB_2_TITLE = "§ 2 Vertragsschluss / Übertragung von Rechten und Pflichten / Vollmacht";
const AGB_2_TEXT =
  "1) Die von dem Verkäufer beauftragten Handelsvertreter sind zum Abschluss von Kaufverträgen nicht berechtigt. Sie nehmen lediglich den Kaufantrag des Käufers entgegen. 2) Der Käufer ist 4 Wochen an seinen Auftrag gebunden. Lehnt der Verkäufer nicht binnen von 4 Wochen nach der Auftragserteilung des Käufers die Auftragsannahme ab, so gilt die Bestätigung als erteilt. 3) Die Übertragung von Rechten und Pflichten aus dem Kaufvertrag bedarf der schriftlichen Zustimmung des Verkäufers..";
const AGB_3_TITLE = "§ 3 Preise / Zahlungsbedingungen";
const AGB_3_TEXT =
  "1) Die Preise verstehen sich rein Netto ab Luckenwalde 2) Kosten des Transports und der Transportversicherung sind in dem in Auftragsformular angegebenen Gesamtpreis nicht enthalten und gehen gesondert zulasten des Käufers. 3) hinsichtlich der Zahlungsbedingungen gelten die in dem Antragsformular festgelegten Zahlungsvereinbarungen. 4) Der Abzug vom Skonto bedarf besonderer schriftlicher Vereinbarung. 5) Kommt der Käufer mit der Zahlung in Verzug so ist die Geldschuld während des Verzuges gemäß den gesetzlichen Regelungen zu verzinsen. Es steht dem Verkäufer frei, einen höheren Zinssatz durch Vorlage konkreter Nachweise zu verlangen. 6) Bleibt bei Ratenzahlungsvereinbarungen der Käufer mit einer Rate 2 Wochen nach Fälligkeit im Rückstand oder wird über sein Vermögen die Insolvenz eröffnet, so wird der gesamte Restkaufpreis fällig. 7) Aufrechnungsrechte stehen dem Käufer nur zu, wenn seine Gegenansprache rechtskräftig festgestellt, unbestritten oder von dem Verkäufer anerkannt sind. Außerdem ist der Käufer zur Ausübung eines Zurückbehaltungsrechts nur insoweit befugt, als. sein Gegenanspruch auf dem gleichen Vertragsverhältnis beruht.";
const AGB_4_TITLE = "§ 4 Lieferung";
const AGB_4_TEXT =
  "1) Die Einhaltung unserer Lieferverpflichtung setzt die rechtzeitige und ordnungsgemäße Erfüllung der Verpflichtungen des Käufers voraus. Die Einrede des nichterfüllten Vertrages bleibt vorbehalten. 2) Ist der Verkäufer mit der Lieferung mehr als 8 Wochen in Verzug, haftet er nach den gesetzlichen Bestimmungen, sofern der Lieferverzug auf einer von dem Verkäufer zu vertretenen oder einer grob fahrlässigen Vertragsverletzung beruht. 3) Wird die Lieferung auf Wunsch oder durch ein sonstiges Verhalten des Käufers verschoben, so stimmt der Verkäufer der späteren Lieferung nur dann zu, wenn der Käufer eine Anzahlung in Höhe von 30% des Nettokaufpreises leistet..";
const AGB_5_TITLE = "§ 5 Gefahrenübergang";
const AGB_5_TEXT =
  "1) Die Gefahr des zufälligen Unterganges und der zufälligen Verschlechterung der Ware geht mit der Übergabe, beim Versendungskauf mit der Auslieferung der Sache an den Spediteur, den Frachtführer oder sonst zur Ausführung bestimmten Person oder Anstalt auf den Käufer über. 2) Die Übergabe steht es gleich, wenn der Käufer in Verzug mit der Abnahme ist.";
// Rechte Spalte (§ 6–10)
const AGB_6_TITLE = "§ 6 Abnahmeverzug / Vertragsverletzung / Nichterfüllung";
const AGB_6_TEXT =
  "1) Kommt der Käufer in Abnahmeverzug oder verletzt er schuldhaft sonstige Mitwirkungspflichten, oder erfüllt er seinen Vertrag nicht, oder tritt er unberechtigt vom Vertrag zurück, oder er widerruft diesen unberechtigt, ist der Verkäufer berechtigt, Schadenersatz wegen Nichterfüllung zu verlangen. 2) Als Schadenersatz wegen Nichterfüllung bei Abnahmeverzug kann der Verkäufer vorbehaltlich der Geltendmachung eines höheren nachgewiesenen Schadens 30% des Nettokaufpreises fordern, soweit der Käufer nicht nachweist, dass ein Schaden überhaupt nicht oder nicht in der Höhe der Pauschale entstanden ist. 3) Im übrigen ist der Verkäufer berechtigt, den ihm entstehenden Schaden, einschließlich etwaiger Mehraufwendungen ersetzt zu verlangen. Weitergehende Ansprüche des Verkäufers bleiben vorbehalten";
  const AGB_7_TITLE = "§ 7 Gewährleistung und Mängelhaftung";
const AGB_7_TEXT =
  "1) Der Käufer ist verpflichtet, den Liefergegenstand unverzüglich nach Anlieferung auf Mängel und Schäden hin zu überprüfen. Die Mängelanzeige ist dem Verkäufer gegenüber ohne schuldhaftes Zögern abzugeben. Mängelrügen bedürfen der Schriftform. 2) Garantien im Rechtssinne erhält der Käufer durch den Verkäufer nicht. Herstellergarantien bleiben davon unberührt. 3) Soweit ein Mangel der Kaufsache vorliegt, ist der Verkäufer nach seiner Wahl zur Nacherfüllung in Form einer Mängelbeseitigung oder zur Lieferung einer neuen mangelfreien Sache berechtigt. 4) Schlägt die Nacherfüllung fehl, kann der Käufer nach seiner Wahl Herabsetzung der Vergütung (Minderung) oder Rückgängigmachung des Vertrages (Rücktritt) verlangen. Bei einer nur geringfügigen Vertragswidrigkeit, insbesondere bei nur geringfügigen Mängeln, steht dem Käufer jedoch kein Rücktrittsrecht zu. 5) Die Verjährungsfrist für Mängelansprüche beträgt 12 Monate für Neugeräte und 6 Monate für Gebrauchtgeräte, gerechnet ab dem Gefahrenübergang. 6) Bei Eingriffen von unberufener Seite in den Kaufgegenstand erlischt der Anspruch auf Gewährleistung. Die Gewährleistung erlisch weiter, wenn der Käufer die Vorschriften des Verkäufers oder der Lieferfirrma durch Nichtbeachtung der Betriebsanleitung über die Behandlung des Kaufgegenstandes nicht befolgt hat. 7) Alle während der Gewährleistung defekt werdenden Teile des Kaufgegenstandes werden kostenlos umgetauscht. Der Einbau neuer Teile erfolgt durch den zuständigen Kundendienst. Äußere Beschädigungen, die durch Verschulden des Käufers oder seines Personals entstehen, fallen nicht unter die Gewährleistung. Das Gleiche gilt für alle elektrischen Teile und solche Teile, die einem normalen Verschleiß unterliegen. 8) Für Verluste, die durch Störungen an den gelieferten Gegenständen innerhalb der Gewährleistung entstehen oder für Verluste, die dadurch entstehen, dass der Kaufgegenstand während der Gewährleistung vorübergehend nicht benutzt ist, kann kein Anspruch auf Schadenersatz geltend gemacht werden. 9) Bei grob fahrlässigen und vorsätzlichen Pflichtverletzung beschränkt sich unsere Haftung auf den nach der Art der Ware vorhersehbaren, vertragstypischen, unmittelbaren Durchschnittsschaden. Dies gilt auch bei grob fahrlässigen und vorsätzlichen Pflichtverletzungen unserer Vertreter oder Erfüllungsgehilfen. Die Haftung wegen schuldhafter Verletzung des Lebens, des Körpers oder der Gesundheit bleibt unberührt. 10) Der Verstoß des Käufers gegen seine Verpflichtung aus §7 Ziffer 1) schließt jedwede Sachmängelhaftung des Verkäufers aus.";

const AGB_8_TITLE = "§ 8 Gesamthaftung";
const AGB_8_TEXT =
  "1) Eine weitergehende Haftung auf Schadenersatz als in § 7 und § 8 vorgesehen ist ohne Rücksicht auf die Rechtsnatur des geltend gemachten Anspruchs ausgeschlossen. Der Haftungsmaßstab von §7 ist insbesondere anzuwenden auf Schadensersatzansprüche aus Verschulden bei Vertragsschluss, wegen sonstiger Pflichtverletzungen oder wegen deliktischer Ansprüche auf Ersatz von Sachschäden gemäß § 823 BGB. 2) Soweit die Schadenersatzhaftung uns gegenüber ausgeschlossen oder eingeschränkt ist, gilt dies auch im Hinblick auf die persönliche Schadensersatzhaftung unserer Vertreter und Erfüllungsgehilfen.";
const AGB_9_TITLE = "§ 9 Eigentumsvorbehalt";
const AGB_9_TEXT =
  "1) Wir behalten uns das Eigentum an der Kaufsache bis zur vollständigen Begleichung aller Forderungen aus einer laufenden Geschäftsbeziehung vor. 2) Der Käufer ist verpflichtet, die Ware pfleglich zu behandeln. Sofern Wartungs- und Inspektionsarbeiten erforderlich sind, hat der Käufer dies auf eigene Kosten regelmäßig durchzuführen. 3) Bei Pfändungen oder sonstigen Zugriffen Dritter hat uns der Käufer unverzüglich schriftlich zu benachrichtigen, damit wir Klage gemäß § 771 ZPO erheben können. Soweit der Dritte nicht in der Lage ist uns die gerichtlichen und außergerichtlichen Kosten einer Klage gemäß § 771 ZPO zu erstatten, haftet der Käufer für den uns entstandenen Ausfall. Ebenso hat uns der Käufer den eigenen Wohnsitzwechsel unverzüglich anzuzeigen. 4) Wir sind berechtigt, bei vertragswidrigem Verhalten des Käufers, insbesondere bei Zahlungsverzug oder bei Verletzung einer Pflicht nach Ziffer 2. und 3. dieser Bestimmung vom Vertrag zurückzutreten und die Ware herauszuverlangen. 5) Eine Weiterveräußerung der Ware ist untersagt.";
const AGB_10_TITLE = "§ 10 Gerichtsstand / Erfüllungsort";
const AGB_10_TEXT =
  "1) Sofern der Käufer Kaufmann ist, ist unser Geschäftssitz Gerichtsstand; wir sind jedoch berechtigt, den Käufer auch an dem für seinen Wohnsitz zuständigen Gericht zu verklagen. 2) Es gilt das Recht der Bundesrepublik Deutschland; die Geltung des UN-Kaufrechts ist ausgeschlossen. Sofern sich aus der Auftragsbestätigung nichts anderes ergibt, ist unser Geschäftssitz Erfüllungsort.";

function drawPage2(
  doc: jsPDF,
  font: "Poppins" | "helvetica" = PDF_FONT_FALLBACK,
  images?: Page1Images
) {
  doc.addPage();

  // Header (same as page 1, with bleed so flush with top/left/right)
  if (images?.headerDataUrl) {
    doc.addImage(
      images.headerDataUrl,
      "PNG",
      -HEADER_FOOTER_BLEED_MM,
      0,
      PAGE_WIDTH + 2 * HEADER_FOOTER_BLEED_MM,
      HEADER_HEIGHT_MM + HEADER_FOOTER_BLEED_MM
    );
  }

  // ========== Abstände Seite 2 (in mm) – hier Blockabstände anpassen ==========
  // titleToBody = Abstand zwischen §-Überschrift und erstem Zeile Text
  // lineHeight  = Zeilenhöhe innerhalb eines Blocks (kleiner = mehr Text pro Block)
  // afterBlock  = Abstand nach jedem Block (zwischen §1-Text und §2-Überschrift etc.)
  // colWidth   = Breite einer Spalte: (PAGE_WIDTH - 2*MARGIN - AGB_COLUMN_GAP) / 2 (oben AGB_COLUMN_GAP kleiner = breitere Blöcke)
  const colWidth = (PAGE_WIDTH - 2 * MARGIN - AGB_COLUMN_GAP) / 2;
  const col2X = MARGIN + colWidth + AGB_COLUMN_GAP;
  const titleSize = 16;
  const bodySize = AGB_BODY_SIZE;
  const titleToBody = 4;      // war 3 – kleiner = weniger Abstand Überschrift → Text
  const lineHeight = 2.9;     // war 3.2 – kleiner = mehr Zeilen pro Block
  const afterBlock = 2;     // war 2.5 – weniger Abstand zwischen §-Blöcken

  let y = images?.headerDataUrl ? HEADER_HEIGHT_MM + 4 : 18;
  doc.setFont(font, "bold");
  doc.setFontSize(titleSize);
  doc.text(AGB_PAGE_TITLE, PAGE_WIDTH / 2, 30, { align: "center" });
  y += 20;


  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);

  // ===== Linke Spalte (§ 1–6) =====
  let col1Y = y;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_1_TITLE, MARGIN, col1Y, { maxWidth: colWidth });
  col1Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col1Y = drawJustifiedBlock(doc, AGB_1_TEXT, MARGIN, col1Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_2_TITLE, MARGIN, col1Y, { maxWidth: colWidth });
  col1Y += titleToBody+2;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col1Y = drawJustifiedBlock(doc, AGB_2_TEXT, MARGIN, col1Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_3_TITLE, MARGIN, col1Y, { maxWidth: colWidth });
  col1Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col1Y = drawJustifiedBlock(doc, AGB_3_TEXT, MARGIN, col1Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_4_TITLE, MARGIN, col1Y, { maxWidth: colWidth });
  col1Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col1Y = drawJustifiedBlock(doc, AGB_4_TEXT, MARGIN, col1Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_5_TITLE, MARGIN, col1Y, { maxWidth: colWidth });
  col1Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col1Y = drawJustifiedBlock(doc, AGB_5_TEXT, MARGIN, col1Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_6_TITLE, MARGIN, col1Y, { maxWidth: colWidth });
  col1Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col1Y = drawJustifiedBlock(doc, AGB_6_TEXT, MARGIN, col1Y, colWidth, lineHeight) + afterBlock;

  // ===== Rechte Spalte (§ 7–10) =====
  let col2Y = y;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_7_TITLE, col2X, col2Y, { maxWidth: colWidth });
  col2Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col2Y = drawJustifiedBlock(doc, AGB_7_TEXT, col2X, col2Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_8_TITLE, col2X, col2Y, { maxWidth: colWidth });
  col2Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col2Y = drawJustifiedBlock(doc, AGB_8_TEXT, col2X, col2Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_9_TITLE, col2X, col2Y, { maxWidth: colWidth });
  col2Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col2Y = drawJustifiedBlock(doc, AGB_9_TEXT, col2X, col2Y, colWidth, lineHeight) + afterBlock;

  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 1);
  doc.text(AGB_10_TITLE, col2X, col2Y, { maxWidth: colWidth });
  col2Y += titleToBody;
  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);
  col2Y = drawJustifiedBlock(doc, AGB_10_TEXT, col2X, col2Y, colWidth, lineHeight) + afterBlock;

  // Footer (same as page 1: thin bar, full width, flush left/right/bottom)
  if (images?.footerDataUrl) {
    doc.addImage(
      images.footerDataUrl,
      "PNG",
      -HEADER_FOOTER_BLEED_MM,
      PAGE_HEIGHT - FOOTER_HEIGHT_MM - FOOTER_BOTTOM_BLEED_MM,
      PAGE_WIDTH + 2 * HEADER_FOOTER_BLEED_MM,
      FOOTER_HEIGHT_MM + FOOTER_BOTTOM_BLEED_MM
    );
  }
  const agbSignatureLineY = PAGE_HEIGHT - 20;
  line(doc, agbSignatureLineY, 140, PAGE_WIDTH - MARGIN);
  doc.setFontSize(SMALL);
  doc.text("Datum / Unterschrift", 140, PAGE_HEIGHT - 17);

  // Cross 3: yellow cross left of AGB "Datum / Unterschrift" (client signs Allgemeine Geschäftsbedingungen)
  if (images?.crossDataUrl) {
    const s = SIGN_CROSS_SIZE_MM;
    const cross3Y = agbSignatureLineY - s / 2 + CROSS3_Y_OFFSET_MM;
    try {
      doc.addImage(images.crossDataUrl, "PNG", CROSS3_X_MM, cross3Y, s, s);
    } catch {
      // ignore if cross image invalid
    }
  }
}

/**
 * Build the Bestellung PDF and trigger download in the browser.
 * Loads header/footer SVGs from /images/ when running in browser for a cleaner look.
 * Call this from your form (e.g. Export PDF button) with the current form data.
 */
export async function downloadBestellungPdf(data: BestellungPdfData): Promise<void> {
  const [images, fonts] = await Promise.all([loadHeaderFooterImages(), loadPoppinsFonts()]);
  const usePoppins = !!(fonts.normal && fonts.bold);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (usePoppins) registerPoppinsInDoc(doc, fonts);
  const font = usePoppins ? PDF_FONT : PDF_FONT_FALLBACK;
  drawPage1(doc, data, font, images);
  drawPage2(doc, font, images);
  doc.save("Bestellung.pdf");
}

/**
 * Build the PDF and return as Blob (e.g. for sending by email or uploading).
 * When called from the browser, loads Poppins and header/footer images if not provided.
 */
export async function buildBestellungPdf(
  data: BestellungPdfData,
  images?: Page1Images
): Promise<Blob> {
  const resolvedImages = images ?? (await loadHeaderFooterImages());
  const fonts = await loadPoppinsFonts();
  const usePoppins = !!(fonts.normal && fonts.bold);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (usePoppins) registerPoppinsInDoc(doc, fonts);
  const font = usePoppins ? PDF_FONT : PDF_FONT_FALLBACK;
  drawPage1(doc, data, font, resolvedImages);
  drawPage2(doc, font, resolvedImages);
  return doc.output("blob");
}
