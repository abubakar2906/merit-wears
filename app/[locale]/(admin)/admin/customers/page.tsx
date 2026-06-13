import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  order_count: number;
}

export default async function AdminCustomersPage() {
  const admin = supabaseAdmin();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const ids = (profiles || []).map((p: any) => p.id);
  let counts: Record<string, number> = {};
  if (ids.length) {
    const { data: orders } = await admin
      .from("orders")
      .select("user_id")
      .in("user_id", ids);
    (orders || []).forEach((o: any) => {
      if (o.user_id) counts[o.user_id] = (counts[o.user_id] || 0) + 1;
    });
  }

  const rows: Row[] = (profiles || []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    created_at: p.created_at,
    order_count: counts[p.id] || 0
  }));

  return (
    <div className="max-w-container mx-auto">
      <header className="mb-stack-lg">
        <span className="text-label-sm uppercase tracking-widest text-secondary">Clientele</span>
        <h1 className="font-display text-headline-lg text-primary mt-1">Customers</h1>
      </header>

      <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3 text-label-sm uppercase">Name</th>
              <th className="px-4 py-3 text-label-sm uppercase">Email</th>
              <th className="px-4 py-3 text-label-sm uppercase">Phone</th>
              <th className="px-4 py-3 text-label-sm uppercase">Orders</th>
              <th className="px-4 py-3 text-label-sm uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-background">
                <td className="px-4 py-3">{r.full_name || "—"}</td>
                <td className="px-4 py-3 text-secondary">{r.email}</td>
                <td className="px-4 py-3 text-secondary">{r.phone || "—"}</td>
                <td className="px-4 py-3 font-bold">{r.order_count}</td>
                <td className="px-4 py-3 text-secondary">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-stack-lg text-center text-secondary">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
