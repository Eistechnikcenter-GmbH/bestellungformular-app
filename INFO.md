# Project Information — Bestellung (Order Form)

> Central place for all project-related information. Update this file as the project evolves.

---

## Overview

- **Project name:** Bestellung (Order Form)
- **Purpose:** External, password-protected order form for sales colleagues that pulls contact/lead data from Odoo, pre-fills the form (replacing the current manual PDF process), and can send the form. Optionally, sent forms appear as history in Odoo CRM.
- **Status:** Planning / gathering requirements
- **Company:** Eistechnikcenter GmbH (Seller on the form)

---

## Odoo Environment

| Item | Value |
|------|--------|
| **Odoo version** | 19 |
| **Hosting** | Odoo.sh |
| **Staging base URL** | `https://etc-gmbh-staging-new-28366156.dev.odoo.com/` |
| **Production** | To be used once staging works; say if you need production URL/keys earlier. |
| **Booking / subscription code** | `M250922249470354` |

### API Access

| Item | Value |
|------|--------|
| **API type** | [Odoo 19 External JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html) |
| **Staging API key** | `a53db271f47eccbafd4a4a4d9d61f02ce7c5ad47` |
| **API base path** | `/json/2/<model>/<method>` (e.g. `https://etc-gmbh-staging-new-28366156.dev.odoo.com/json/2/res.partner/search_read`) |
| **Auth header** | `Authorization: bearer <API_KEY>` |
| **Optional header** | `X-Odoo-Database` — required only if the server hosts multiple databases; for Odoo.sh we may need to confirm the database name. |

**Security note:** In the app, the API key must be stored in **environment variables** (e.g. Vercel env vars), never committed to Git. For production, use a separate API key and rotate the staging key if it was ever exposed.

---

## Goals & Requirements

1. **CRM/Contacts/Leads in one place**  
   Sales colleagues need access to all CRM / contacts / leads information, listed in the tool, to create a new “order” from it.

2. **Password-protected page**  
   The external page must be secured with a password; ideally with **two-factor authentication (2FA)**. Preference: free tool, API-based if needed.

3. **Replace manual PDF form**  
   The current order form is a PDF filled in manually. The new flow:
   - Pull data from the Odoo database and **pre-fill the form** in the external tool.
   - Form structure and fields should match the existing PDF order form (Eistechnikcenter “Bestellung” with Verkäufer/Käufer, Lieferadresse, order lines, delivery options, options, legal/consent, signatures).

4. **Send the form from the tool**  
   The form should be **sendable from this tool**: **both** create/update the order in Odoo **and** send the filled form as PDF by email.

5. **Hosting**  
   The external page must be **hosted on Vercel**, deployed via **GitHub**.

5b. **Responsive design**  
   The whole page (tiles, lists, form) must be **responsive for smartphone** (readable and usable on small screens).

6. **History in Odoo (optional)**  
   If possible, **sent forms should be visible as history inside the CRM** in Odoo (e.g. by creating a sale order, lead activity, or attached document in Odoo when the form is submitted).

---

## Form Reference (Current PDF)

- **Order form:** “Bestellung” — Eistechnikcenter GmbH (see project assets/images for reference).
- **Sections:** Verkäufer (fixed), Käufer (business + delivery address), order lines (Stück, Artikel, Netto/Brutto, MwSt.), delivery preferences, Optionen, legal/consent, signatures.
- **Terms:** “Allgemeine Geschäfts- und Lieferbedingungen” (ETC) apply; may be shown or linked from the form.

---

## Technical Notes & Discussion

### 1. Odoo JSON-2 API availability

- **Confirmed:** Custom Odoo pricing plan with Odoo.sh — JSON-2 API is available. No blocker.

### 2. Leads vs. Opportunities (Verkaufschance)

- In Odoo, **crm.lead** has two types: **Leads** (`type='lead'`) and **Opportunities** / **Verkaufschance** (`type='opportunity'`). Leads are the initial entries; opportunities are the sales pipeline (Verkaufschance) when a lead is qualified/converted.
- Our app’s **CRM** tile shows **Opportunities (Verkaufschance)** only (`type='opportunity'`), i.e. the CRM sales pipeline. It does not show Leads (`type='lead'`). So the list matches Odoo’s sales opportunities / Verkaufschance view.

### 3. Database name for API

- On Odoo.sh, the database name might be different from the subdomain. If the server uses `dbfilter` or multiple DBs, we may need to set the **`X-Odoo-Database`** header. We can confirm this when testing the first API call.

### 4. Authentication for the external page (password + 2FA)

- **Confirmed:** No specific 2FA provider required; safe 2FA is enough. We will use **TOTP** (Google Authenticator–compatible) in-app: no paid provider, no external API required. Password (env) + TOTP 2FA, both implemented in our app.

### 5. “Send form” — clarify

- **Confirmed:** **Option C** — best case is both: **create or update in Odoo** (sdo the order/history is in CRM) **and send PDF by email**. We will implement both.

### 6. History in Odoo CRM

- Technically straightforward **if** we create records in Odoo when the form is submitted (e.g. `sale.order` or an activity/note on a lead/partner). Then the “sent form” is visible in Odoo. We can optionally attach the generated PDF to that record via the API if Odoo supports it.

### 7. Vercel + GitHub

- Standard flow: repo on GitHub → connect repo in Vercel → deploy on push. No technical blocker.

---

## Confirmed Answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Odoo.sh plan includes External JSON-2 API? | **Yes** — Custom pricing plan with Odoo.sh. |
| 2 | Send form: email only, Odoo only, or both? | **Both (C)** — create/update in Odoo and send PDF by email. |
| 3 | 2FA provider preference? | **No specific provider** — safe 2FA is enough (we use TOTP in-app). |
| 4 | When to switch to production? | **When the software is done** — we'll document production URL and API key then. |

## Open Questions

| # | Question | Owner |
|---|----------|--------|
| 1 | Who should receive the **emailed** PDF (customer, sales, both)? Any fixed "from"/"to" address? | You |

---

## Stack (Planned)

- **Hosting:** Vercel (via GitHub).
- **Backend:** Vercel serverless/API routes for auth, Odoo proxy (so API key stays server-side), and optional PDF generation / email.
- **Frontend:** TBD (e.g. Next.js or similar) for the form and listing of contacts/leads.
- **Auth:** Password + optional TOTP 2FA (free, in-app).
- **Odoo:** Odoo 19 JSON-2 API (`res.partner`, `crm.lead`, `sale.order`, etc.).

---

## Structure & Conventions

- **App code:** `bestellung-app/` (Next.js; for Vercel set “Root Directory” to `bestellung-app`).
- **API / Odoo:** Config and domain come from **environment variables** only. To switch to production: change `ODOO_BASE_URL`, `ODOO_API_KEY`, and `NEXT_PUBLIC_APP_DOMAIN` in env (e.g. in Vercel); no code change required, the tool will not crash.
- **PDF export:** Implemented in a **separate file/folder** in the codebase (`src/lib/pdf-export/`, entry: `bestellung-pdf.ts`) so the layout and behaviour can be manually chosen and adjusted without touching the rest of the app.
- **UI style:** Do not use smileys or emojis. Every SVG or symbol in the app must be a minimalistic vector SVG to keep the interface clean.

---

## Decisions & Notes

- **Staging first;** production URL and API key when the software is done.
- API key and auth secrets only in environment variables, never in Git.
- Form fields and layout follow the existing “Bestellung” PDF.
- **Send form:** both create/update in Odoo and send PDF by email.
- **Auth:** password + TOTP 2FA (in-app, no specific provider).
- **Odoo plan:** Custom (JSON-2 API confirmed available).
- **Production switch:** Change only env (API URL, API key, app domain); no code change needed.
- **PDF:** Separate module under `src/lib/pdf-export/` for manual control.

---

## Links & References

- [Odoo 19 — External JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)
- Staging Odoo: <https://etc-gmbh-staging-new-28366156.dev.odoo.com/>
- Form reference: project assets (Bestellung PDF, AGB)

---

## Changelog

| Date       | Change |
|------------|--------|
| 2025-02-07 | Created INFO.md |
| 2025-02-07 | Filled with Odoo 19/Odoo.sh, staging URL, API key, booking code, full requirements, form reference, technical notes, open questions |
| 2025-02-07 | Confirmed: Custom plan (JSON-2 OK), send form = both Odoo + email PDF, 2FA = TOTP in-app, production when done; added Confirmed Answers, updated Decisions |
| 2025-02-07 | First build: tiles (Bestellformular, CRM, Leads, Kontakte), CRM list from Odoo, env-based config, PDF in `lib/pdf-export/`, responsive + production-switch note in INFO.md |
