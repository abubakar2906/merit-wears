import Link from "next/link";
import { supabaseServer, supabaseAdmin } from "@/lib/supabaseServer";
import { formatNaira } from "@/lib/formatCurrency";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = supabaseServer();

  const [{ count: totalOrders }, { count: pendingOrders }, { count: totalProducts }, { count: totalCustomers }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer")
    ]);

  const { data: recent } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const stats = [
    { label: "Total Orders", value: totalOrders ?? 0 },
    { label: "Pending Orders", value: pendingOrders ?? 0 },
    { label: "Total Products", value: totalProducts ?? 0 },
    { label: "Total Customers", value: totalCustomers ?? 0 }
  ];

  return (
    <div className="max-w-container mx-auto">
      <header className="flex justify-between items-center mb-stack-lg">
        <div>
          <span className="text-label-sm uppercase tracking-widest text-secondary">Overview</span>
          <h1 className="font-display text-headline-lg text-primary mt-1">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="bg-primary text-on-primary px-4 py-2 text-label-md uppercase tracking-widest"
          >
            Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="border border-outline-variant px-4 py-2 text-label-md uppercase tracking-widest hover:bg-surface-container"
          >
            Orders
          </Link>
          <Link
            href="/admin/promos"
            className="border border-outline-variant px-4 py-2 text-label-md uppercase tracking-widest hover:bg-surface-container"
          >
            Promos
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-section-gap">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-surface-container-lowest p-stack-md border border-outline-variant"
          >
            <p className="text-label-sm uppercase tracking-widest text-secondary">{s.label}</p>
            <p className="font-display text-headline-md text-on-surface mt-2">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
        <div className="px-gutter py-stack-md border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-display text-headline-md">Recent Orders</h2>
          <Link href="/admin/orders" className="text-label-md text-secondary hover:text-primary">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary border-b border-outline-variant">
                <th className="px-gutter py-3 text-label-sm uppercase">Order</th>
                <th className="px-gutter py-3 text-label-sm uppercase">Customer</th>
                <th className="px-gutter py-3 text-label-sm uppercase">Date</th>
                <th className="px-gutter py-3 text-label-sm uppercase">Total</th>
                <th className="px-gutter py-3 text-label-sm uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {((recent as Order[]) || []).map((o) => (
                <tr key={o.id} className="hover:bg-background">
                  <td className="px-gutter py-3 text-label-md">{o.order_number}</td>
                  <td className="px-gutter py-3">{o.customer_name}</td>
                  <td className="px-gutter py-3 text-secondary">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-gutter py-3 font-bold">{formatNaira(o.total_amount)}</td>
                  <td className="px-gutter py-3">
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-tighter bg-surface-container-highest text-on-surface-variant">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!recent || recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-gutter py-stack-lg text-center text-secondary">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
