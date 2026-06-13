"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/formatCurrency";
import type { Order, Profile } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect_to=/account");
      return;
    }
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (p) {
        setProfile(p as Profile);
        setPhone((p as any).phone || "");
        setAddress((p as any).address || "");
      }
      const { data: o } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((o as Order[]) || []);
    })();
  }, [user, loading, router, supabase]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setSavedMsg(null);
    const { error } = await (supabase.from("profiles") as any)
      .update({ phone, address })
      .eq("id", user.id);
    setSaving(false);
    setSavedMsg(error ? error.message : "Profile saved.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading || !user) return null;

  return (
    <>
      <Navbar />
      <main className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
        <div className="flex justify-between items-center mb-stack-lg">
          <div>
            <span className="text-label-sm uppercase tracking-widest text-secondary">Account</span>
            <h1 className="font-display text-headline-lg text-primary mt-1">
              {profile?.full_name || "Welcome"}
            </h1>
            <p className="text-secondary">{profile?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="border border-outline-variant px-4 py-2 text-label-sm uppercase tracking-widest hover:bg-primary hover:text-on-primary"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <section className="lg:col-span-1 bg-surface-container-low border border-outline-variant p-stack-md">
            <h2 className="font-display text-headline-md text-primary mb-stack-md">Profile</h2>
            <div className="space-y-stack-md">
              <div>
                <label className="text-label-md uppercase text-primary block mb-1">Phone</label>
                <input
                  className="input-line text-body-md"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-label-md uppercase text-primary block mb-1">Address</label>
                <textarea
                  rows={3}
                  className="input-line text-body-md resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              {savedMsg && <p className="text-label-md text-secondary">{savedMsg}</p>}
              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 bg-primary text-on-primary text-label-md uppercase tracking-widest disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </section>

          <section className="lg:col-span-2">
            <h2 className="font-display text-headline-md text-primary mb-stack-md">Order History</h2>
            {orders.length === 0 ? (
              <div className="border border-outline-variant py-section-gap flex flex-col items-center justify-center bg-surface-container-low text-center">
                <div className="w-16 h-16 rounded-full bg-surface border border-outline-variant flex items-center justify-center mb-stack-md text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-9"/><path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 .96 1.67v9.52a1.93 1.93 0 0 1-.96 1.67l-4.2 2.36a1.67 1.67 0 0 1-1.63 0l-4.2-2.36a1.93 1.93 0 0 1-.96-1.67V6.24a1.93 1.93 0 0 1 .96-1.67Z"/><path d="M20 5.5 12 10 4 5.5"/><path d="m7.5 4.21 4.5 2.53"/></svg>
                </div>
                <h3 className="font-display text-2xl text-primary mb-2">No Orders Yet</h3>
                <p className="text-secondary text-body-md mb-stack-md max-w-xs">
                  You haven't placed any orders. Your order history will appear here.
                </p>
                <Link
                  href="/shop"
                  className="text-label-sm uppercase tracking-widest text-primary border-b border-primary hover:border-transparent transition-colors"
                >
                  Start Shopping →
                </Link>
              </div>
            ) : (
              <div className="border border-outline-variant divide-y divide-outline-variant">
                {orders.map((o) => (
                  <details key={o.id} className="group">
                    <summary className="cursor-pointer flex items-center justify-between p-stack-md hover:bg-surface-container-low">
                      <div>
                        <p className="text-label-md text-primary">{o.order_number}</p>
                        <p className="text-label-sm text-secondary">
                          {new Date(o.created_at).toLocaleDateString()} · {o.items.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-stack-md">
                        <span className="font-bold">{formatNaira(o.total_amount)}</span>
                        <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 text-[10px] font-bold uppercase tracking-tighter">
                          {o.status}
                        </span>
                      </div>
                    </summary>
                    <div className="px-stack-md pb-stack-md text-body-md">
                      <ul className="space-y-1 mb-2">
                        {o.items.map((it, i) => (
                          <li key={i} className="text-secondary">
                            {it.name} ({it.size}) × {it.quantity} —{" "}
                            {formatNaira(it.price * it.quantity)}
                          </li>
                        ))}
                      </ul>
                      <p className="text-secondary text-label-sm">
                        Delivery: {o.customer_address}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
