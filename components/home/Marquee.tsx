"use client";

const PRESS = [
  "VOGUE",
  "GQ",
  "ESQUIRE",
  "ARISE",
  "BELLA NAIJA",
  "OFFICIEL",
  "WSJ",
  "FT — HOW TO SPEND IT"
];

export default function Marquee() {
  return (
    <section className="border-y border-outline-variant bg-surface-container-lowest overflow-hidden py-stack-md">
      <div className="flex items-center justify-center gap-3 mb-stack-sm">
        <span className="h-px w-8 bg-outline-variant" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">
          As featured in
        </p>
        <span className="h-px w-8 bg-outline-variant" />
      </div>
      <div className="flex whitespace-nowrap animate-marquee gap-16 opacity-60">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-16 shrink-0 px-8">
            {PRESS.map((p) => (
              <span
                key={p + i}
                className="font-display text-2xl md:text-3xl tracking-[0.15em] text-on-surface-variant"
              >
                {p}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
