"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Lightweight top progress bar that runs on:
 *  - any pathname change (real navigation)
 *  - any anchor click (gives instant feedback while RSC payload is fetched)
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);
  const isFirst = useRef(true);

  // Trigger on click of any internal link
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest("a");
      if (!t) return;
      const href = (t as HTMLAnchorElement).getAttribute("href");
      if (!href) return;
      // Only internal nav, no external/tel/mailto/anchors
      if (
        href.startsWith("/") &&
        !t.hasAttribute("target") &&
        !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      ) {
        setActive(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // When pathname or search params actually change, complete the bar.
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setActive(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), 500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pathname, search]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="progress"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{
            scaleX: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.25, delay: 0.1 }
          }}
          style={{ transformOrigin: "0% 50%" }}
          className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[100] shadow-[0_0_8px_rgba(0,6,19,0.35)]"
        />
      )}
    </AnimatePresence>
  );
}
