import { odooDisplayValue } from "../odoo-display";

export type PartnerCandidate = {
  id: number;
  name: string;
};

const MIN_WORD_LENGTH = 3;
const MIN_SUBSTRING_LENGTH = 4;

function normalize(value: unknown): string {
  return odooDisplayValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/["""'']/g, "")
    .replace(/[&+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameWords(value: unknown): string[] {
  return normalize(value)
    .split(/[\s\-–—]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= MIN_WORD_LENGTH);
}

function tokens(value: unknown): string[] {
  return normalize(value)
    .split(/[,;/]|(?:\s+und\s+)|\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= MIN_WORD_LENGTH);
}

/** Match token against partner name words — avoids "a" matching inside "Giuffrida". */
function tokenMatchesName(token: string, words: string[]): boolean {
  const t = normalize(token);
  if (t.length < MIN_WORD_LENGTH) return false;

  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH) continue;
    if (word === t) return true;
    if (
      t.length >= MIN_SUBSTRING_LENGTH &&
      word.length >= MIN_SUBSTRING_LENGTH &&
      (word.includes(t) || t.includes(word))
    ) {
      return true;
    }
  }

  return false;
}

function scoreSegment(segment: unknown, candidate: unknown): number {
  const s = normalize(segment);
  const c = normalize(candidate);
  if (!s || !c) return 0;
  if (s === c) return 1;

  const words = nameWords(candidate);
  const segTokens = tokens(segment);
  if (segTokens.length === 0) return 0;

  let hits = 0;
  for (const token of segTokens) {
    if (tokenMatchesName(token, words)) hits += 1;
  }
  return hits / segTokens.length;
}

/** Score how well a leasing text matches a partner or CRM opportunity name (0–1). */
export function scorePartnerMatch(leasingText: unknown, partnerName: unknown): number {
  const leasing = odooDisplayValue(leasingText);
  const a = normalize(leasing);
  const b = normalize(partnerName);
  if (a && b && a === b) return 1;

  const segments = leasing
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) return scoreSegment(leasing, partnerName);

  let best = 0;
  for (const segment of segments) {
    best = Math.max(best, scoreSegment(segment, partnerName));
  }
  best = Math.max(best, scoreSegment(leasing, partnerName));
  return best;
}

export type FuzzyMatchResult = {
  partnerId: number;
  partnerName: string;
  score: number;
};

const SEARCH_STOPWORDS = new Set([
  "gmbh",
  "restaurant",
  "ristorante",
  "pizzeria",
  "weinbar",
  "catering",
  "tankstelle",
  "backerei",
  "bäckerei",
  "event",
  "gastronomie",
  "und",
  "the",
  "der",
  "die",
  "das",
]);

/** Extract Odoo search terms from leasing text (distinctive names, not generic words). */
export function extractLeasingSearchTerms(leasingText: unknown): string[] {
  const text = odooDisplayValue(leasingText);
  const terms = new Set<string>();
  const segments = text
    .split(/[,;]/)
    .map((s) => s.replace(/["']/g, "").trim())
    .filter(Boolean);

  for (const segment of segments) {
    if (segment.length >= 5 && !SEARCH_STOPWORDS.has(normalize(segment))) {
      terms.add(segment);
    }
    for (const word of segment.split(/[\s&+]+/).map((w) => w.trim())) {
      const n = normalize(word);
      if (n.length >= 5 && !SEARCH_STOPWORDS.has(n)) {
        terms.add(word);
      }
    }
  }

  return [...terms].sort((a, b) => b.length - a.length).slice(0, 6);
}

/** Find the best partner match for a leasing-customer text. */
export function findBestPartnerMatch(
  leasingText: unknown,
  partners: PartnerCandidate[],
  threshold: number
): FuzzyMatchResult | null {
  const query = odooDisplayValue(leasingText).trim();
  if (!query) return null;

  let best: FuzzyMatchResult | null = null;
  for (const partner of partners) {
    const score = scorePartnerMatch(query, partner.name);
    if (score < threshold) continue;
    if (!best || score > best.score) {
      best = { partnerId: partner.id, partnerName: partner.name, score };
    }
  }
  return best;
}
