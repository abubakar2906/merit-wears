import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = (profile as any)?.role === "admin";

  const { data, error } = await supabaseAdmin()
    .from("orders").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && (data as any).user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ order: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
