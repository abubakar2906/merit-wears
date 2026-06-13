import Image from "next/image";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabaseServer";
import { formatNaira } from "@/lib/formatCurrency";
import { MOCK_PRODUCTS } from "@/lib/mockProducts";
import AddToCart from "./AddToCart";
import type { Product } from "@/types";

export const revalidate = 60;

export default async function ProductDetail({ params }: { params: { id: string } }) {
  let product: Product | null = null;

  if (params.id.startsWith("mock-")) {
    product = MOCK_PRODUCTS.find((p) => p.id === params.id) || null;
  } else {
    try {
      const supabase = supabasePublic();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .single();
      product = (data as Product) || null;
    } catch {
      product = null;
    }
  }

  if (!product) notFound();
  const p = product;

  const stockLabel =
    p.stock_quantity === 0
      ? "Out of Stock"
      : p.stock_quantity < 5
      ? `Low Stock (${p.stock_quantity} left)`
      : "In Stock";

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {/* Image */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] bg-surface-variant border border-outline-variant overflow-hidden">
            {p.image_urls?.[0] && (
              <Image src={p.image_urls[0]} alt={p.name} fill className="object-cover" priority />
            )}
          </div>
          {p.image_urls?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {p.image_urls.slice(0, 4).map((u, i) => (
                <div key={i} className="relative aspect-square bg-surface-variant border border-outline-variant">
                  <Image src={u} alt={`${p.name} ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-label-sm uppercase tracking-widest text-secondary mb-2">
            {p.category}
          </span>
          <h1 className="font-display text-headline-lg text-primary mb-2">{p.name}</h1>
          <p className="text-headline-md text-on-surface-variant mb-stack-md">
            {formatNaira(p.price)}
          </p>
          <div className="h-px bg-outline-variant mb-stack-md" />

          <p
            className={`text-label-sm uppercase tracking-widest mb-stack-md ${
              p.stock_quantity === 0
                ? "text-error"
                : p.stock_quantity < 5
                ? "text-error"
                : "text-secondary"
            }`}
          >
            {stockLabel}
          </p>

          <AddToCart product={p} />

          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant">
            <h3 className="text-label-sm uppercase tracking-widest text-secondary mb-2">Description</h3>
            <p className="text-body-md text-on-surface-variant whitespace-pre-line">
              {p.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
