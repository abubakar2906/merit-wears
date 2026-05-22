"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/formatCurrency";
import { buildWhatsAppURL } from "@/lib/whatsapp";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, supabase, loading } = useAuth();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clearCart = useCart((s) => s.clearCart);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect_to=/checkout");
      return;
    }
    // Pre-fill from profile
    supabase
      .from("profiles")
      .select("full_name, phone, address")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName((data as any).full_name || "");
          setPhone((data as any).phone || "");
          setAddress((data as any).address || "");
        }
      });
  }, [user, loading, router, supabase]);

  useEffect(() => {
    if (!loading && items.length === 0) router.replace("/cart");
  }, [items, loading, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    if (!phone.trim()) e.phone = "Required";
    if (!address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          notes,
          items,
          total_amount: total
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Order failed");
      }
      const { order_number } = await res.json();

      const url = buildWhatsAppURL({
        orderNumber: order_number,
        customerName: name,
        phone,
        address,
        items,
        total,
        notes: notes || undefined
      });

      clearCart();
      window.open(url, "_blank");
      router.push("/account");
    } catch (err: any) {
      setServerError(
        err.message || "Something went wrong. Your order was not placed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      <h1 className="font-display text-headline-lg text-primary mb-stack-lg">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-stack-md">
          <h2 className="text-label-sm uppercase tracking-widest text-secondary mb-2">
            Delivery Details
          </h2>

          <div>
            <label className="text-label-sm uppercase tracking-widest text-primary block mb-1">
              Full Name
            </label>
            <input
              className="input-line"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Christian Dior"
            />
            {errors.name && <p className="text-error text-label-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-label-sm uppercase tracking-widest text-primary block mb-1">
              Phone Number
            </label>
            <input
              className="input-line"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
            />
            {errors.phone && <p className="text-error text-label-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-label-sm uppercase tracking-widest text-primary block mb-1">
              Delivery Address
            </label>
            <textarea
              className="input-line resize-none"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state"
            />
            {errors.address && <p className="text-error text-label-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="text-label-sm uppercase tracking-widest text-primary block mb-1">
              Order Notes (optional)
            </label>
            <textarea
              className="input-line resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Custom measurements, gift instructions..."
            />
          </div>

          {serverError && <p className="text-error text-label-md">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-4 text-label-md uppercase tracking-widest hover:bg-primary-container disabled:opacity-60"
          >
            {submitting ? "Placing Order…" : "Chat on WhatsApp to Order →"}
          </button>
          <p className="text-label-sm text-center text-secondary">
            You will be redirected to WhatsApp to confirm your order.
          </p>
        </form>

        <aside className="bg-surface-container-low border border-outline-variant p-stack-md h-fit">
          <h2 className="font-display text-headline-md text-primary mb-stack-md">Order Summary</h2>
          <div className="space-y-3 mb-stack-md">
            {items.map((i) => (
              <div key={`${i.product_id}-${i.size}`} className="flex justify-between text-body-md">
                <span>
                  {i.name} <span className="text-secondary">({i.size}) ×{i.quantity}</span>
                </span>
                <span>{formatNaira(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-outline-variant pt-stack-md flex justify-between font-bold">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
          <Link href="/cart" className="block text-center text-label-sm uppercase tracking-widest text-secondary mt-stack-md hover:text-primary">
            Edit Cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
