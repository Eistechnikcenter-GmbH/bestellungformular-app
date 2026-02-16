# Bestellung — Eistechnikcenter

External order form and CRM/Leads/Kontakte tool for sales, connected to Odoo.

- **App:** `bestellung-app/` (Next.js, runs on port 3000).
- **Config:** See [INFO.md](./INFO.md) for requirements, Odoo setup, and production switch.

## Run locally (port 3000)

```bash
cd bestellung-app
cp .env.local.example .env.local
# Edit .env.local: set ODOO_BASE_URL and ODOO_API_KEY (see INFO.md for staging values)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Tiles: Bestellformular, CRM, Leads, Kontakte. CRM loads data from Odoo.

## Deploy (Vercel)

1. Push to GitHub.
2. In Vercel, set **Root Directory** to `bestellung-app`.
3. Add env vars: `ODOO_BASE_URL`, `ODOO_API_KEY`, and `NEXT_PUBLIC_APP_DOMAIN` (your Vercel URL). Switch to production by changing these only.
