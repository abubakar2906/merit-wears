import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import ProductGrid from "@/components/products/ProductGrid";
import { getMockProducts } from "@/lib/mockProducts";
import type { Category, Product } from "@/types";

export const dynamic = "force-dynamic";

const CATS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "clothing", label: "Kaftans" },
  { key: "shoes", label: "Footwear" },
  { key: "watches", label: "Watches" },
  { key: "accessories", label: "Accessories" }
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" }
];

export default async function ShopPage({
  searchParams
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const category = (searchParams.category || "all") as "all" | Category;
  const sort = searchParams.sort || "newest";

  let products: Product[] = [];
  try {
    const supabase = supabaseServer();
    let q = supabase.from("products").select("*").eq("is_active", true);
    if (category !== "all") q = q.eq("category", category);
    if (sort === "price_asc") q = q.order("price", { ascending: true });
    else if (sort === "price_desc") q = q.order("price", { ascending: false });
    else q = q.order("created_at", { ascending: false });
    const { data } = await q;
    products = (data as Product[]) || [];
  } catch {
    products = [];
  }

  if (products.length === 0) {
    products = getMockProducts({ category, limit: 50 });
    if (sort === "price_asc") products = [...products].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") products = [...products].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      <header className="mb-stack-lg">
        <span className="text-label-sm uppercase tracking-widest text-secondary">Shop</span>
        <h1 className="font-display text-headline-lg text-primary mt-2">The Collection</h1>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-stack-md border-y border-outline-variant py-4 mb-stack-lg">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <Link
              key={c.key}
              href={{
                pathname: "/shop",
                query: { ...(c.key !== "all" && { category: c.key }), ...(sort !== "newest" && { sort }) }
              }}
              className={`px-4 py-2 text-label-sm uppercase tracking-widest border ${
                category === c.key
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-primary hover:bg-surface-container"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-sm uppercase tracking-widest text-secondary">Sort</span>
          <div className="flex gap-2">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={{
                  pathname: "/shop",
                  query: { ...(category !== "all" && { category }), ...(s.key !== "newest" && { sort: s.key }) }
                }}
                className={`px-3 py-2 text-label-sm border ${
                  sort === s.key
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant text-primary hover:bg-surface-container"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
