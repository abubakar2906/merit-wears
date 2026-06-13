"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const switchTo = (nextLocale: string) => {
    if (nextLocale === locale) return;

    startTransition(() => {
      // Set a persistent cookie so middleware remembers the preference
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // Build the new URL: strip any existing locale prefix, then prepend the new one
      const currentPath = window.location.pathname;
      
      // Remove existing locale prefix (e.g. /fr/shop → /shop)
      const strippedPath = currentPath.replace(/^\/(en|fr)(?=\/|$)/, "") || "/";

      // For French (non-default), always prefix. For English (default), go bare.
      const newPath = nextLocale === "en" ? strippedPath : `/${nextLocale}${strippedPath}`;

      window.location.href = newPath;
    });
  };

  return (
    <div className="relative inline-flex items-center gap-1 border border-outline-variant">
      <button
        onClick={() => switchTo("en")}
        disabled={isPending}
        className={`px-3 py-1 text-label-sm uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
          locale === "en"
            ? "bg-primary text-on-primary"
            : "text-primary hover:bg-surface-container-low"
        }`}
      >
        EN
      </button>
      <span className="text-outline-variant">|</span>
      <button
        onClick={() => switchTo("fr")}
        disabled={isPending}
        className={`px-3 py-1 text-label-sm uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
          locale === "fr"
            ? "bg-primary text-on-primary"
            : "text-primary hover:bg-surface-container-low"
        }`}
      >
        FR
      </button>
    </div>
  );
}
