# PDF Export

This folder contains the **Bestellung** (order form) PDF generation logic, kept separate so you can:

- Manually adjust layout or fields
- Reuse or replace the implementation without touching the rest of the app
- Keep PDF-specific dependencies and types in one place

## Entry point

- **`bestellung-pdf.ts`** – main export: build PDF from form data (and optionally Odoo context). Use this from API routes or server actions when you need to generate or email the order PDF.

## Switching behaviour

To change what gets included in the PDF or how it looks, edit the files in this folder. The rest of the app only calls the exported function(s) from here.
