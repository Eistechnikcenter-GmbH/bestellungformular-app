import { CDN_SVG } from "@/lib/cdn-assets";

const CDN = CDN_SVG;

export type V2Module = {
  title: string;
  iconSrc: string;
  href?: string;
  comingSoon?: boolean;
};

export const v2Modules: V2Module[] = [
  {
    title: "Dashboards",
    iconSrc: `${CDN}/CarbonDashboardReference.svg`,
    comingSoon: true,
  },
  {
    title: "Chat",
    iconSrc: `${CDN}/CarbonChat.svg`,
    comingSoon: true,
  },
  {
    title: "Kalender",
    iconSrc: `${CDN}/CarbonCalendar.svg`,
    comingSoon: true,
  },
  {
    title: "Wissensdatenbank",
    iconSrc: `${CDN}/CarbonBookmarkAdd.svg`,
    comingSoon: true,
  },
  {
    title: "CRM",
    iconSrc: `${CDN}/PhHandshake.svg`,
    comingSoon: true,
  },
  {
    title: "Kontakte",
    iconSrc: `${CDN}/CarbonUserProfile.svg`,
    comingSoon: true,
  },
  {
    title: "Bestellformular",
    iconSrc: `${CDN}/CarbonDocumentAttachment.svg`,
    href: "/bestellformular",
  },
  {
    title: "Kundendienst",
    iconSrc: `${CDN}/CarbonTaskTools%20(1).svg`,
    comingSoon: true,
  },
  {
    title: "Auslieferung",
    iconSrc: `${CDN}/CarbonDelivery.svg`,
    comingSoon: true,
  },
  {
    title: "Lager",
    iconSrc: `${CDN}/PhPackage.svg`,
    comingSoon: true,
  },
  {
    title: "Projekt",
    iconSrc: `${CDN}/CarbonListChecked.svg`,
    comingSoon: true,
  },
  {
    title: "Newsletter",
    iconSrc: `${CDN}/HeroiconsNewspaper.svg`,
    comingSoon: true,
  },
  {
    title: "Buchhaltung",
    iconSrc: `${CDN}/CarbonPercentage.svg`,
    comingSoon: true,
  },
  {
    title: "Fuhrpark",
    iconSrc: `${CDN}/CarbonCar.svg`,
    comingSoon: true,
  },
  {
    title: "Abonnements",
    iconSrc: `${CDN}/CarbonRenew.svg`,
    comingSoon: true,
  },
  {
    title: "Mitarbeiter",
    iconSrc: `${CDN}/CarbonUserMultiple.svg`,
    comingSoon: true,
  },
];
