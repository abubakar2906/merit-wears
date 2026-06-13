import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
  const { code, type, value, max_uses, valid_from, valid_until, influencer_name, min_order_amount, is_active } = body;

  const updateData: any = {};
  if (code) updateData.code = code.trim().toUpperCase();
  if (type) updateData.type = type;
  if (value !== undefined) updateData.value = value;
  if (max_uses !== undefined) updateData.max_uses = max_uses;
  if (valid_from !== undefined) updateData.valid_from = valid_from ? new Date(valid_from).toISOString() : null;
  if (valid_until !== undefined) updateData.valid_until = valid_until ? new Date(valid_until).toISOString() : null;
  if (influencer_name !== undefined) updateData.influencer_name = influencer_name;
  if (min_order_amount !== undefined) updateData.min_order_amount = min_order_amount;
  if (is_active !== undefined) updateData.is_active = is_active;

  const admin = supabaseAdmin();

  // Ensure we don't reduce max_uses below uses_count
  if (max_uses !== undefined && max_uses !== null) {
    const { data: existing } = await admin.from("promo_codes").select("uses_count").eq("id", params.id).single();
    if (existing && existing.uses_count > max_uses) {
      return NextResponse.json({ error: `Cannot reduce max uses below current usage (${existing.uses_count})` }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from("promo_codes")
    .update(updateData)
    .eq("id", params.id)
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Soft delete
  const { error } = await supabaseAdmin()
    .from("promo_codes")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
