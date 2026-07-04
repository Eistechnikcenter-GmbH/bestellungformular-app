import Image from "next/image";
import Link from "next/link";
import { CDN_LOGO_DOG } from "@/lib/cdn-assets";

type AppLogoProps = {
  href?: string;
  className?: string;
  height?: number;
};

export function AppLogo({ href, className = "h-12 w-auto", height = 48 }: AppLogoProps) {
  const img = (
    <Image
      src={CDN_LOGO_DOG}
      alt="Eistechnikcenter"
      width={200}
      height={height}
      className={className}
      style={{ width: "auto", height: "3rem" }}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
