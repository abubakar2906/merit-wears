import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";
import { verifyTransaction } from "@/lib/monnify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Reference is required" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Ownership check
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("payment_reference", reference)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ status: "paid", order_number: order.order_number });
  }

  if (order.payment_status === "pending" && order.payment_channel === "ACCOUNT_TRANSFER") {
    return NextResponse.json({ status: "transfer_pending", order_number: order.order_number });
  }

  if (order.payment_status === "unpaid" || order.payment_status === "pending") {
    try {
      const monnifyData = await verifyTransaction(reference);

      if (monnifyData.paymentStatus === "PAID") {
        // Call confirm_payment RPC
        const { data: rpcData, error: rpcError } = await admin.rpc("confirm_payment", {
          p_payment_reference: reference,
          p_monnify_ref: monnifyData.transactionReference,
          p_amount_paid: monnifyData.amountPaid,
          p_payment_channel: monnifyData.paymentMethod,
          p_note: "Payment verified via client verification poll"
        });

        if (rpcError) {
          console.error("[verify] RPC error:", rpcError);
          return NextResponse.json({ status: "pending" });
        }

        return NextResponse.json({ status: "paid", order_number: order.order_number });
      }

      return NextResponse.json({ status: "pending" });
    } catch (err) {
      console.error("[verify] verification failed:", err);
      // Let the client keep polling if there's a temporary network error
      return NextResponse.json({ status: "pending" });
    }
  }

  return NextResponse.json({ status: order.payment_status });
}
