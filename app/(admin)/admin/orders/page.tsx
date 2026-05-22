import { supabaseServer } from "@/lib/supabaseServer";
import OrdersClient from "./OrdersClient";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: { status?: string };
}) {
  const supabase = supabaseServer();
  let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (searchParams.status && searchParams.status !== "all") {
    q = q.eq("status", searchParams.status);
  }
  const { data } = await q;
  return <OrdersClient initial={(data as Order[]) || []} status={searchParams.status || "all"} />;
}
