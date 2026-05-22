import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as any)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  let q = supabaseAdmin().from("orders").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(req: NextRequest) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customer_name, customer_phone, customer_address, items, total_amount, notes } = body;

  if (!customer_name || !customer_phone || !customer_address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const year = new Date().getFullYear();
  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const order_number = `MW-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

  const { data, error } = await admin
    .from("orders")
    .insert({
      order_number,
      user_id: user.id,
      customer_name,
      customer_phone,
      customer_address,
      items,
      total_amount,
      notes: notes || null,
      status: "pending",
      whatsapp_sent: false
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data, order_number });
}
