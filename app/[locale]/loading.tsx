import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-primary bg-surface">
      <Loader2 size={48} strokeWidth={1} className="animate-spin text-primary opacity-50 mb-4" />
      <p className="text-label-sm uppercase tracking-widest text-secondary animate-pulse">Loading House of Merit...</p>
    </div>
  );
}
