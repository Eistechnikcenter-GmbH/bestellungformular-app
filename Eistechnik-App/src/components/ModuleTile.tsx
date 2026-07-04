import Link from "next/link";
import Image from "next/image";

type ModuleTileProps = {
  title: string;
  iconSrc: string;
  href?: string;
  comingSoon?: boolean;
};

export function ModuleTile({ title, iconSrc, href, comingSoon }: ModuleTileProps) {
  const className =
    "flex h-full min-h-[168px] flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-[#f3f3f3] px-4 py-6 text-center shadow-sm transition";

  const inner = (
    <>
      <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center">
        <Image
          src={iconSrc}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
          aria-hidden
        />
      </div>
      <span className="text-base font-semibold text-stone-900">{title}</span>
      <span
        className={`mt-1 block min-h-[1.25rem] text-xs font-medium ${
          comingSoon ? "text-stone-400" : "text-transparent"
        }`}
        aria-hidden={!comingSoon}
      >
        {comingSoon ? "Bald verfügbar" : "Platzhalter"}
      </span>
    </>
  );

  if (href && !comingSoon) {
    return (
      <Link
        href={href}
        className={`${className} hover:border-[#9b1b4b]/30 hover:bg-white hover:shadow-md`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`${className} ${comingSoon ? "cursor-default opacity-70" : ""}`}
      aria-disabled={comingSoon}
    >
      {inner}
    </div>
  );
}
