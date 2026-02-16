import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bestellung | Eistechnikcenter",
  description: "Bestellformular, CRM, Leads, Kontakte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-stone-100 text-stone-800 antialiased">
        {children}
      </body>
    </html>
  );
}
