"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, User, X, Search, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?category=clothing", label: "Native Kaftans" },
  { href: "/shop?category=shoes", label: "Footwear" },
  { href: "/shop?category=watches", label: "Watches" }
];

export default function Navbar() {
  const count = useCart((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Announcement marquee */}
      <div className="bg-primary text-on-primary overflow-hidden border-b border-on-primary/10">
        <div className="flex whitespace-nowrap py-2 animate-marquee gap-16 text-label-sm uppercase tracking-[0.3em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-16 shrink-0 px-8">
              <span>Complimentary delivery within Lagos</span>
              <span className="opacity-50">◆</span>
              <span>Bespoke embroidery available</span>
              <span className="opacity-50">◆</span>
              <span>The Midnight Sterling Collection — Out Now</span>
              <span className="opacity-50">◆</span>
            </div>
          ))}
        </div>
      </div>

      <nav
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-surface/85 backdrop-blur-xl border-b border-outline-variant"
            : "bg-surface border-b border-transparent"
        }`}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container mx-auto">
          {/* Left */}
          <div className="flex items-center gap-stack-md">
            <button
              className="md:hidden text-primary -ml-1 p-1"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <div className="hidden md:flex items-center gap-stack-md">
              {NAV_LINKS.slice(0, 3).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant hover:text-primary relative group"
                >
                  {l.label}
                  <span className="absolute left-0 -bottom-1 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>

          {/* Center brand */}
          <Link
            href="/"
            className="font-display text-2xl md:text-headline-md font-bold tracking-tight text-primary text-center whitespace-nowrap"
          >
            Merit Wears
          </Link>

          {/* Right */}
          <div className="flex items-center gap-1 justify-end">
            <Link
              href="/shop"
              className="hidden md:inline-flex w-10 h-10 items-center justify-center text-primary hover:bg-surface-container-low transition-colors"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="w-10 h-10 inline-flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors"
              aria-label="Account"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
            <Link
              href="/cart"
              className="w-10 h-10 inline-flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {mounted && count > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-on-primary text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-[85%] max-w-sm bg-surface md:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-margin-mobile py-5 border-b border-outline-variant">
                <span className="font-display text-xl font-bold text-primary">Merit Wears</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="w-10 h-10 -mr-2 inline-flex items-center justify-center text-primary"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-stack-sm">
                <p className="px-margin-mobile pt-stack-md pb-stack-sm text-label-sm uppercase tracking-[0.2em] text-secondary">
                  Shop
                </p>
                <ul>
                  {NAV_LINKS.map((l, i) => (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                    >
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-margin-mobile py-4 border-b border-outline-variant/60 text-on-surface hover:bg-surface-container-low"
                      >
                        <span className="font-display text-2xl">{l.label}</span>
                        <ChevronRight size={18} strokeWidth={1.5} className="text-secondary" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <p className="px-margin-mobile pt-stack-lg pb-stack-sm text-label-sm uppercase tracking-[0.2em] text-secondary">
                  Account
                </p>
                <ul>
                  <li>
                    <Link
                      href={user ? "/account" : "/login"}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-margin-mobile py-4 border-b border-outline-variant/60"
                    >
                      <User size={18} strokeWidth={1.5} />
                      <span className="text-label-md uppercase tracking-[0.15em]">
                        {user ? "My Account" : "Sign In"}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cart"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-margin-mobile py-4 border-b border-outline-variant/60"
                    >
                      <ShoppingBag size={18} strokeWidth={1.5} />
                      <span className="text-label-md uppercase tracking-[0.15em]">Cart ({mounted ? count : 0})</span>
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="px-margin-mobile py-stack-md border-t border-outline-variant bg-surface-container-low">
                <p className="text-label-sm uppercase tracking-[0.2em] text-secondary mb-1">Atelier</p>
                <p className="text-body-md text-on-surface-variant">
                  Lagos, Nigeria
                  <br />
                  By appointment only.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
