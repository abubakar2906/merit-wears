"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-surface">
      <AlertCircle size={48} strokeWidth={1} className="text-error mb-4" />
      <h2 className="font-display text-2xl text-primary mb-2">Something went wrong</h2>
      <p className="text-secondary text-body-md max-w-md mx-auto mb-6">
        We encountered an issue loading this page. Please try again or contact support if the problem persists.
      </p>
      <button
        onClick={reset}
        className="border border-primary text-primary px-8 py-3 text-label-sm uppercase tracking-widest hover:bg-surface-container-low transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
