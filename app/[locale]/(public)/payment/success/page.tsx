"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentReference = searchParams.get("paymentReference");
  const clearCart = useCart((s) => s.clearCart);

  const [status, setStatus] = useState<"checking" | "paid" | "transfer_pending" | "timeout">("checking");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentReference) {
      router.replace("/");
      return;
    }

    let pollCount = 0;
    const maxPolls = 10; // 30 seconds max (10 * 3s)
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/verify?reference=${encodeURIComponent(paymentReference)}`);
        if (!res.ok) throw new Error("Verification failed");
        const data = await res.json();

        if (data.status === "paid") {
          setStatus("paid");
          setOrderNumber(data.order_number);
          clearCart();
          clearInterval(pollInterval);
          setTimeout(() => {
            router.replace(`/orders/${data.order_number}`);
          }, 3000);
        } else if (data.status === "transfer_pending") {
          setStatus("transfer_pending");
          setOrderNumber(data.order_number);
          clearInterval(pollInterval);
        } else {
          pollCount++;
          if (pollCount >= maxPolls) {
            setStatus("timeout");
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
        pollCount++;
        if (pollCount >= maxPolls) {
          setStatus("timeout");
          clearInterval(pollInterval);
        }
      }
    };

    checkStatus();
    pollInterval = setInterval(checkStatus, 3000);
    return () => clearInterval(pollInterval);
  }, [paymentReference, router, clearCart]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-margin-mobile py-stack-lg max-w-container mx-auto">
      <div className="max-w-md w-full border border-outline-variant p-stack-lg text-center bg-surface-container-low shadow-sm">
        
        {status === "checking" && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h1 className="font-display text-headline-sm text-primary">Verifying Payment</h1>
            <p className="text-body-md text-secondary">
              Please wait while we confirm your transaction with Monnify. Do not refresh this page.
            </p>
          </div>
        )}

        {status === "paid" && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h1 className="font-display text-headline-sm text-primary">Payment Successful</h1>
            <p className="text-body-md text-secondary">
              Your order {orderNumber && <strong className="text-primary">{orderNumber}</strong>} has been confirmed.
            </p>
            <p className="text-label-sm uppercase tracking-widest text-secondary pt-4">
              Redirecting to tracking...
            </p>
          </div>
        )}

        {status === "transfer_pending" && (
          <div className="flex flex-col items-center space-y-4">
            <Clock className="h-16 w-16 text-secondary" />
            <h1 className="font-display text-headline-sm text-primary">Transfer Initiated</h1>
            <p className="text-body-md text-secondary">
              Your bank transfer has been initiated. Transfers typically confirm within 5–30 minutes. 
              We'll update your order automatically — no need to stay on this page.
            </p>
            {orderNumber && (
              <div className="mt-4 border border-outline-variant p-4 w-full bg-surface">
                <span className="block text-label-sm uppercase tracking-widest text-secondary mb-1">Order Reference</span>
                <span className="font-display text-headline-sm text-primary">{orderNumber}</span>
              </div>
            )}
            <Link 
              href={orderNumber ? `/orders/${orderNumber}` : "/profile"} 
              className="btn-primary w-full mt-stack-md block"
            >
              Track Order
            </Link>
          </div>
        )}

        {status === "timeout" && (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-16 w-16 text-warning" />
            <h1 className="font-display text-headline-sm text-primary">Verification Delayed</h1>
            <p className="text-body-md text-secondary">
              Payment verification is taking longer than expected. If your account was debited, your order will be confirmed automatically once Monnify notifies us.
            </p>
            <Link href="/profile" className="btn-primary w-full mt-stack-md block">
              View Order History
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
