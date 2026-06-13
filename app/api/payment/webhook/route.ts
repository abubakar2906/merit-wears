import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/monnify";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Step 1: Read raw body as text — BEFORE any parsing
  const rawBody = await request.text();

  // Step 2: IP whitelist check (defense in depth)
  const sourceIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const allowedIps = (process.env.MONNIFY_WEBHOOK_IPS ?? "").split(",");
  if (allowedIps.length > 0 && allowedIps[0] !== "" && !allowedIps.includes(sourceIp ?? "")) {
    console.warn(`[webhook] Rejected request from unexpected IP: ${sourceIp}`);
    return new NextResponse("OK", { status: 200 }); // silent, same as bad HMAC
  }

  // Step 3: HMAC-SHA512 signature verification
  const signature = request.headers.get("monnify-signature") ?? "";
  try {
    const signatureValid = verifyWebhookSignature(rawBody, signature);
    // Return 200 on bad signature (not 400) — 400 triggers Monnify retry storm
    if (!signatureValid) {
      console.error("[webhook] Invalid HMAC signature — possible tampered request");
      return new NextResponse("OK", { status: 200 });
    }
  } catch (err) {
    console.error("[webhook] Signature verification error:", err);
    return new NextResponse("OK", { status: 200 });
  }

  // Step 4: Parse body (safe to parse now)
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error("[webhook] Invalid JSON body");
    return new NextResponse("OK", { status: 200 });
  }

  // Step 5: Only handle successful transactions; ack everything else
  if (body.eventType !== "SUCCESSFUL_TRANSACTION") {
    return NextResponse.json({ responseCode: "00", responseMessage: "Acknowledged" });
  }

  const { paymentReference, transactionReference, amountPaid, paymentMethod } = body.eventData;

  // Step 6: Server-side verify with Monnify (never trust payload alone)
  let monnifyData;
  try {
    const verificationResponse = await verifyTransaction(paymentReference);
    monnifyData = verificationResponse;
    if (monnifyData.paymentStatus !== "PAID") {
       console.error(`[webhook] Payment not fully paid in Monnify verification. Status: ${monnifyData.paymentStatus}`);
       return NextResponse.json({ responseCode: "00", responseMessage: "Logged" });
    }
  } catch (err) {
    console.error("[webhook] Monnify verify call failed:", err);
    // Return 200 so Monnify doesn't retry; log for manual investigation
    return NextResponse.json({ responseCode: "00", responseMessage: "Logged" });
  }

  // Step 7: Call confirm_payment RPC (atomic triple-write: order + event + promo)
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("confirm_payment", {
    p_payment_reference: paymentReference,
    p_monnify_ref: transactionReference,
    p_amount_paid: monnifyData.amountPaid,
    p_payment_channel: paymentMethod,
  });

  if (error) {
    // Log with full context for monitoring/alerting
    console.error("[webhook] confirm_payment RPC error:", {
      error,
      paymentReference,
      transactionReference,
    });
    // Still return 200 to prevent retry storm; investigate via logs
    return NextResponse.json({ responseCode: "00", responseMessage: "Logged" });
  }

  // Step 8: Log retry events for visibility (idempotent already_paid responses)
  if (data?.status === "already_paid") {
    console.warn("[webhook] Received duplicate webhook for already-paid order:", paymentReference);
  }

  return NextResponse.json({ responseCode: "00", responseMessage: "Success" });
}
