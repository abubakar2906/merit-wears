import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRoute();
  
  // Auth & Admin check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { status, note } = body;

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Call the update_order_status RPC defined in Phase 1
  const { data, error } = await admin.rpc("update_order_status", {
    p_order_id: params.id,
    p_status: status,
    p_note: note || null,
    p_admin_id: user.id
  });

  if (error) {
    console.error("[update_order_status RPC error]:", error);
    // The RPC throws exceptions for invalid transitions or not found orders.
    // Supabase returns these exceptions as the error message.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, new_status: data.new_status });
}
