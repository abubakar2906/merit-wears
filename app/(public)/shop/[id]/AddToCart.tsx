"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/types";

export default function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useAuth();
  const addItem = useCart((s) => s.addItem);
  const [size, setSize] = useState<string>(product.sizes?.[0] || "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const isOOS = product.stock_quantity === 0;

  const handleAdd = () => {
    setError(null);
    if (!size) {
      setError("Please select a size");
      return;
    }
    if (!user) {
      router.push(`/login?redirect_to=/shop/${product.id}`);
      return;
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      size,
      image_url: product.image_urls?.[0] || ""
    });
    router.push("/cart");
  };

  return (
    <div className="space-y-stack-md">
      {product.sizes?.length > 0 && (
        <div>
          <label className="text-label-sm uppercase tracking-widest text-primary block mb-3">
            Select Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`border py-2 text-label-md ${
                  size === s
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant text-primary hover:bg-surface-container"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-label-sm uppercase tracking-widest text-primary block mb-3">
          Quantity
        </label>
        <div className="flex items-center border border-outline-variant w-fit">
          <button
            type="button"
            className="px-4 py-2 hover:bg-surface-container"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="px-6 py-2 border-x border-outline-variant min-w-[3rem] text-center">
            {qty}
          </span>
          <button
            type="button"
            className="px-4 py-2 hover:bg-surface-container"
            onClick={() =>
              setQty((q) => Math.min(product.stock_quantity || 99, q + 1))
            }
            disabled={qty >= product.stock_quantity}
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="text-error text-label-md">{error}</p>}

      <button
        disabled={isOOS}
        onClick={handleAdd}
        className="w-full bg-primary text-on-primary text-label-md uppercase tracking-widest py-4 hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isOOS ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}
