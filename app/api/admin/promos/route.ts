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

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;
  const influencer = searchParams.get("influencer");
  const active = searchParams.get("active");

  let query = supabaseAdmin()
    .from("promo_codes")
    .select("*", { count: "exact" });

  if (influencer) {
    query = query.ilike("influencer_name", `%${influencer}%`);
  }
  if (active !== null) {
    query = query.eq("is_active", active === "true");
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ promos: data, count });
}

export async function POST(req: NextRequest) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { code, type, value, max_uses, valid_from, valid_until, influencer_name, min_order_amount } = body;

  if (!code || !type || value === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("promo_codes")
    .insert({
      code: code.trim().toUpperCase(),
      type,
      value,
      max_uses: max_uses || null,
      valid_from: valid_from ? new Date(valid_from).toISOString() : new Date().toISOString(),
      valid_until: valid_until ? new Date(valid_until).toISOString() : null,
      influencer_name: influencer_name || null,
      min_order_amount: min_order_amount || 0,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // unique violation
      return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promo: data });
}
