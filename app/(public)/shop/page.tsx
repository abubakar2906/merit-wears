import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabaseServer";
import { getMockProducts } from "@/lib/mockProducts";
import ShopClient from "./ShopClient";
import type { Product } from "@/types";

export const revalidate = 60;

export default async function ShopPage() {
  let products: Product[] = [];
  try {
    const supabase = supabaseServer();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    products = (data as Product[]) || [];
  } catch {
    products = [];
  }

  if (products.length === 0) {
    products = getMockProducts({ limit: 100 });
  }

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      <header className="mb-stack-lg">
        <span className="text-label-sm uppercase tracking-widest text-secondary">Shop</span>
        <h1 className="font-display text-headline-lg text-primary mt-2">The Collection</h1>
      </header>

      <Suspense fallback={null}>
        <ShopClient products={products} />
      </Suspense>
    </div>
  );
}
