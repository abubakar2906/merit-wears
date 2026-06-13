import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/supabaseServer";
import { initializeTransaction } from "@/lib/monnify";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { customer_name, customer_phone, customer_address, items, total_amount, notes, promo_code } = body;

  if (!customer_name || !customer_phone || !customer_address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  
  // Security & Stock Check: Calculate real total from DB prices
  const outOfStockItems = [];
  let calculated_total = 0;

  for (const item of items) {
    // Fetch price alongside stock to prevent amount tampering
    const { data: product } = await admin
      .from("products")
      .select("stock_quantity, name, price")
      .eq("id", item.product_id)
      .single();

    if (!product || product.stock_quantity < item.quantity) {
      outOfStockItems.push(product?.name || 'Unknown Item');
      continue;
    }

    calculated_total += (product.price * item.quantity);
  }
  
  if (outOfStockItems.length > 0) {
    return NextResponse.json({ 
      error: `The following items are out of stock or have insufficient quantity: ${outOfStockItems.join(", ")}` 
    }, { status: 400 });
  }

  // Prevent amount tampering fraud
  if (total_amount !== calculated_total) {
    return NextResponse.json({ 
      error: `Amount mismatch. Expected ₦${calculated_total} but received ₦${total_amount}. Please refresh your cart.` 
    }, { status: 400 });
  }

  let final_amount = calculated_total; // Use server-calculated total
  let discount_amount = 0;
  let normalized_code = null;

  // Promo Code validation
  if (promo_code) {
    const { data: promoResult, error: promoError } = await admin.rpc('validate_promo', {
      p_code: promo_code,
      p_cart_total: total_amount
    });

    if (promoError) {
       return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
    }

    if (!promoResult.valid) {
      return NextResponse.json({ error: promoResult.message }, { status: 400 });
    }

    final_amount = promoResult.final_amount;
    discount_amount = promoResult.discount_amount;
    normalized_code = promoResult.normalized_code;
  }

  // Idempotency check
  const sortedItems = [...items].sort((a, b) => {
    if (a.product_id !== b.product_id) return a.product_id.localeCompare(b.product_id);
    return a.size.localeCompare(b.size);
  });
  
  const hashString = `${user.id}:${JSON.stringify(sortedItems)}`;
  const idempotency_hash = crypto.createHash("sha256").update(hashString).digest("hex");

  // Check if unpaid order exists (requires idempotency_hash and checkout_url columns added to DB)
  const { data: existingOrder } = await admin
    .from("orders")
    .select("payment_reference, monnify_transaction_ref, checkout_url")
    .eq("idempotency_hash", idempotency_hash)
    .in("payment_status", ["unpaid", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingOrder && existingOrder.checkout_url) {
    return NextResponse.json({
      checkoutUrl: existingOrder.checkout_url,
      order_number: "MW-EXISTING", // We could query order_number but it's simpler to return checkoutUrl
      payment_reference: existingOrder.payment_reference
    });
  }

  // Generate order number
  const year = new Date().getFullYear();
  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const order_number = `MW-${year}-${String((count || 0) + 1).padStart(5, "0")}`;

  const payment_reference = `MW-REF-${crypto.randomBytes(5).toString("hex")}`;

  const { data: newOrder, error: insertError } = await admin
    .from("orders")
    .insert({
      order_number,
      user_id: user.id,
      customer_name,
      customer_phone,
      customer_address,
      items,
      total_amount,
      amount_expected: final_amount,
      promo_code: normalized_code,
      discount_amount,
      notes: notes || null,
      payment_status: "unpaid",
      status: "pending",
      payment_reference,
      idempotency_hash
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create order. " + insertError.message }, { status: 500 });
  }

  try {
    const { checkoutUrl, transactionReference } = await initializeTransaction({
      amount: final_amount,
      customerName: customer_name,
      customerEmail: user.email || "customer@meritwears.com",
      paymentReference: payment_reference,
      paymentDescription: `Merit Wears Order ${order_number}`,
      currencyCode: "NGN",
      contractCode: process.env.MONNIFY_CONTRACT_CODE!,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`
    });

    await admin.from("orders").update({
      monnify_transaction_ref: transactionReference,
      payment_status: "pending",
      checkout_url: checkoutUrl
    }).eq("id", newOrder.id);

    return NextResponse.json({ checkoutUrl, order_number, payment_reference });
  } catch (err: any) {
    console.error("Monnify init failed:", err);
    // Optional: We could delete the order here, or leave it unpaid
    return NextResponse.json({ error: "Payment gateway unavailable. Please try again later." }, { status: 502 });
  }
}
