"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";
import type { Category, Product } from "@/types";

const CATS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "clothing", label: "Kaftans" },
  { key: "shoes", label: "Footwear" },
  { key: "watches", label: "Watches" },
  { key: "accessories", label: "Accessories" }
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" }
];

export default function ShopClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const category = (params.get("category") || "all") as "all" | Category;
  const sort = params.get("sort") || "newest";

  const update = (next: { category?: string; sort?: string }) => {
    const sp = new URLSearchParams(params.toString());
    if ("category" in next) {
      if (next.category && next.category !== "all") sp.set("category", next.category);
      else sp.delete("category");
    }
    if ("sort" in next) {
      if (next.sort && next.sort !== "newest") sp.set("sort", next.sort);
      else sp.delete("sort");
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    let out =
      category === "all" ? products : products.filter((p) => p.category === category);
    if (sort === "price_asc") out = [...out].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") out = [...out].sort((a, b) => b.price - a.price);
    return out;
  }, [products, category, sort]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-stack-md border-y border-outline-variant py-4 mb-stack-lg">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => update({ category: c.key })}
                className={`px-4 py-2 text-label-sm uppercase tracking-widest border transition-colors ${
                  active
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant text-primary hover:bg-surface-container"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-sm uppercase tracking-widest text-secondary">
            Sort
          </span>
          <div className="flex gap-2">
            {SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => update({ sort: s.key })}
                  className={`px-3 py-2 text-label-sm border transition-colors ${
                    active
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant text-primary hover:bg-surface-container"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-label-sm uppercase tracking-widest text-secondary mb-stack-sm">
        {filtered.length} {filtered.length === 1 ? "Piece" : "Pieces"}
      </p>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={category + sort}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter"
        >
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-secondary py-stack-lg">
              No pieces match this filter.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
