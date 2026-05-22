import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = supabaseAdmin();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, created_at")
    .eq("role", "customer");
  const ids = (profiles || []).map((p: any) => p.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: orders } = await admin.from("orders").select("user_id").in("user_id", ids);
    (orders || []).forEach((o: any) => {
      if (o.user_id) counts[o.user_id] = (counts[o.user_id] || 0) + 1;
    });
  }
  const out = (profiles || []).map((p: any) => ({ ...p, order_count: counts[p.id] || 0 }));
  return NextResponse.json({ customers: out });
}
