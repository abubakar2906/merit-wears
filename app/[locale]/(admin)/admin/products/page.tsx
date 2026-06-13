import { supabaseServer } from "@/lib/supabaseServer";
import ProductsClient from "./ProductsClient";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = supabaseServer();
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  return <ProductsClient initial={(data as Product[]) || []} />;
}
