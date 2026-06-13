"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/formatCurrency";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ShoppingBag, Lock } from "lucide-react";

const checkoutSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[+\d][\d\s-]{8,}$/, "Enter a valid phone number"),
  address: z.string().min(10, "Enter your full delivery address"),
  notes: z.string().optional()
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, supabase, loading } = useAuth();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());

  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", phone: "", address: "", notes: "" }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect_to=/checkout");
    }
  }, [user, loading, router]);

  // Redirect to cart if empty
  useEffect(() => {
    if (!loading && items.length === 0) router.replace("/cart");
  }, [items, loading, router]);

  // Pre-fill from saved profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, address")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          if ((data as any).full_name) setValue("name", (data as any).full_name);
          if ((data as any).phone) setValue("phone", (data as any).phone);
          if ((data as any).address) setValue("address", (data as any).address);
        }
      });
  }, [user, supabase, setValue]);

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      const payload = {
        customer_name: data.name,
        customer_phone: data.phone,
        customer_address: data.address,
        items,
        total_amount: total,
        notes: data.notes,
        promo_code: appliedPromo?.normalized_code || undefined
      };

      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to initiate payment");
      }

      if (result.checkoutUrl) {
        // Redirect to Monnify hosted checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("Missing checkout URL from server");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during checkout");
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, cart_total: total })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to validate promo code");

      if (data.valid) {
        setAppliedPromo(data);
        toast.success(`Promo code applied! You saved ${formatNaira(data.discount_amount)}`);
      } else {
        setPromoError(data.message);
        setAppliedPromo(null);
      }
    } catch (err: any) {
      setPromoError(err.message);
      setAppliedPromo(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setPromoCode("");
    setAppliedPromo(null);
    setPromoError(null);
  };

  if (loading || !user) return null;

  const finalTotal = appliedPromo ? appliedPromo.final_amount : total;

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      {/* Header */}
      <div className="mb-stack-lg">
        <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
          Secure Checkout
        </span>
        <h1 className="font-display text-4xl md:text-5xl text-primary mt-2 leading-tight">
          Your Order
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-stack-md">
          {/* Delivery Details */}
          <div className="border border-outline-variant p-stack-md">
            <h2 className="text-label-sm uppercase tracking-[0.2em] text-secondary mb-stack-md">
              Delivery Details
            </h2>

            <div className="space-y-stack-sm">
              <div>
                <label className="text-label-sm uppercase tracking-widest text-primary block mb-2">
                  Full Name
                </label>
                <input
                  className="input-line w-full"
                  {...register("name")}
                  placeholder="Christian Dior"
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-error text-label-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-label-sm uppercase tracking-widest text-primary block mb-2">
                  Phone Number
                </label>
                <input
                  className="input-line w-full"
                  {...register("phone")}
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                  type="tel"
                />
                {errors.phone && (
                  <p className="text-error text-label-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="text-label-sm uppercase tracking-widest text-primary block mb-2">
                  Delivery Address
                </label>
                <textarea
                  className="input-line w-full resize-none"
                  rows={3}
                  {...register("address")}
                  placeholder="Street, area, city, state"
                  autoComplete="street-address"
                />
                {errors.address && (
                  <p className="text-error text-label-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="text-label-sm uppercase tracking-widest text-primary block mb-2">
                  Order Notes{" "}
                  <span className="text-secondary normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  className="input-line w-full resize-none"
                  rows={2}
                  {...register("notes")}
                  placeholder="Custom measurements, gift wrapping instructions…"
                />
              </div>
            </div>
          </div>

          {/* Delivery fee notice */}
          <div className="border border-outline-variant border-dashed p-stack-md bg-surface-container-low">
            <p className="text-label-sm text-secondary">
              <span className="text-primary font-medium">Delivery fee</span> — our team will
              contact you via WhatsApp to confirm delivery costs for your area before dispatch.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary py-4 text-label-md uppercase tracking-widest hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-3"
          >
            <Lock size={14} strokeWidth={2} />
            {isSubmitting ? "Processing…" : `Pay ${formatNaira(finalTotal)} →`}
          </button>

          <p className="flex items-center justify-center gap-2 text-label-sm text-secondary text-center">
            <Lock size={11} strokeWidth={1.5} />
            Secure payment powered by Monnify
          </p>
        </form>

        {/* Order Summary */}
        <aside className="lg:col-span-1">
          <div className="border border-outline-variant p-stack-md sticky top-24">
            <div className="flex items-center gap-2 mb-stack-md pb-stack-sm border-b border-outline-variant">
              <ShoppingBag size={16} strokeWidth={1.5} className="text-primary" />
              <h2 className="font-display text-headline-md text-primary">Order Summary</h2>
            </div>

            <div className="space-y-3 mb-stack-md">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.size}`}
                  className="flex justify-between gap-4 text-body-md"
                >
                  <span className="flex-1 min-w-0">
                    <span className="truncate block text-primary">{item.name}</span>
                    <span className="text-secondary text-label-sm">
                      {item.size} × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="border-t border-outline-variant pt-stack-sm pb-stack-sm mb-stack-sm">
              <label className="text-label-sm uppercase tracking-widest text-primary block mb-2">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={!!appliedPromo || applyingPromo}
                  className="input-line flex-1 uppercase"
                  placeholder="ENTER CODE"
                />
                {!appliedPromo ? (
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || applyingPromo}
                    className="btn-secondary px-4 text-label-sm disabled:opacity-50"
                  >
                    {applyingPromo ? "..." : "Apply"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={removePromo}
                    className="btn-secondary px-4 text-label-sm text-error border-error hover:bg-error/10"
                  >
                    Remove
                  </button>
                )}
              </div>
              {promoError && <p className="text-error text-sm mt-2">{promoError}</p>}
            </div>

            <div className="border-t border-outline-variant pt-stack-sm space-y-2">
              <div className="flex justify-between text-body-md">
                <span className="text-secondary">Subtotal</span>
                <span>{formatNaira(total)}</span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between text-body-md text-success">
                  <span>Discount ({appliedPromo.normalized_code})</span>
                  <span>-{formatNaira(appliedPromo.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-body-md">
                <span className="text-secondary">Delivery</span>
                <span className="text-secondary text-label-sm">Confirmed via WhatsApp</span>
              </div>
              <div className="flex justify-between font-bold text-body-lg pt-2 border-t border-outline-variant">
                <span>Total</span>
                <span>{formatNaira(finalTotal)}</span>
              </div>
            </div>

            <Link
              href="/cart"
              className="block text-center text-label-sm uppercase tracking-widest text-secondary mt-stack-md hover:text-primary transition-colors"
            >
              ← Edit Cart
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
