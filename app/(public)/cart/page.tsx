"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatNaira } from "@/lib/formatCurrency";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-section-gap text-center">
        <h1 className="font-display text-headline-lg text-primary mb-stack-md">
          Your Bag is Empty
        </h1>
        <p className="text-secondary mb-stack-lg">Begin curating your wardrobe.</p>
        <Link
          href="/shop"
          className="inline-block bg-primary text-on-primary px-10 py-4 text-label-md uppercase tracking-widest hover:bg-primary-container"
        >
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      <h1 className="font-display text-headline-lg text-primary mb-stack-lg">Shopping Bag</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 divide-y divide-outline-variant border-y border-outline-variant">
          {items.map((i) => (
            <div key={`${i.product_id}-${i.size}`} className="flex gap-stack-md py-stack-md">
              <div className="relative w-24 h-32 bg-surface-variant border border-outline-variant flex-shrink-0">
                {i.image_url && (
                  <Image src={i.image_url} alt={i.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-body text-body-lg text-primary">{i.name}</h3>
                    <p className="text-label-sm text-secondary uppercase tracking-widest mt-1">
                      Size: {i.size}
                    </p>
                  </div>
                  <span className="font-body text-primary">{formatNaira(i.price * i.quantity)}</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-stack-sm">
                  <div className="flex items-center border border-outline-variant w-fit">
                    <button
                      onClick={() => updateQuantity(i.product_id, i.size, i.quantity - 1)}
                      className="px-3 py-1 hover:bg-surface-container"
                    >
                      −
                    </button>
                    <span className="px-4 py-1 border-x border-outline-variant min-w-[2.5rem] text-center">
                      {i.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(i.product_id, i.size, i.quantity + 1)}
                      className="px-3 py-1 hover:bg-surface-container"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(i.product_id, i.size)}
                    className="text-label-sm uppercase tracking-widest text-secondary hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-surface-container-low border border-outline-variant p-stack-md h-fit">
          <h2 className="font-display text-headline-md text-primary mb-stack-md">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span className="text-secondary">Subtotal</span>
            <span>{formatNaira(total)}</span>
          </div>
          <p className="text-label-sm text-secondary mb-stack-md">
            Delivery fee will be confirmed on WhatsApp.
          </p>
          <div className="border-t border-outline-variant pt-stack-md flex justify-between font-bold mb-stack-md">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center w-full bg-primary text-on-primary py-4 text-label-md uppercase tracking-widest hover:bg-primary-container"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
