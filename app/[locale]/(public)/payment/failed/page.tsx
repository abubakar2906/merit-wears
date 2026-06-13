"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("paymentStatusDescription") || "Transaction failed or was cancelled.";

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-margin-mobile py-stack-lg max-w-container mx-auto">
      <div className="max-w-md w-full border border-outline-variant p-stack-lg text-center bg-surface-container-low shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <XCircle className="h-16 w-16 text-error" />
          <h1 className="font-display text-headline-sm text-primary">Payment Failed</h1>
          <p className="text-body-md text-secondary">
            {reason}
          </p>
          <p className="text-body-sm text-secondary pt-2 border-t border-outline-variant w-full">
            Your cart has been saved. Please try checking out again.
          </p>
          
          <div className="pt-stack-sm space-y-3 w-full">
            <Link href="/checkout" className="btn-primary w-full block">
              Try Again
            </Link>
            <Link href="/cart" className="block text-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors">
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
