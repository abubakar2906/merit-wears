"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import LanguageSwitcher from "./LanguageSwitcher";

export default function Footer() {
  const t = useTranslations("Footer");
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  return (
    <footer className="bg-surface border-t border-outline-variant mt-section-gap">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container mx-auto gap-stack-md">
        <Link href="/" className="font-display text-headline-md text-primary">
          Merit Luxury Wears
        </Link>
        <div className="flex flex-wrap justify-center gap-stack-sm md:gap-stack-md">
          <Link href="/shop" className="text-secondary hover:text-primary text-label-sm uppercase tracking-widest">
            {t("shop")}
          </Link>
          <Link href="/account" className="text-secondary hover:text-primary text-label-sm uppercase tracking-widest">
            {t("account")}
          </Link>
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="text-secondary hover:text-primary text-label-sm uppercase tracking-widest"
          >
            {t("whatsapp")}
          </a>
          <LanguageSwitcher />
        </div>
        <p className="text-secondary text-body-md text-center md:text-right">
          {t("rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
