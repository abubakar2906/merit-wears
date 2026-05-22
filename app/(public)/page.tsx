import Link from "next/link";
import Image from "next/image";
import { Scissors, Award, Truck, Sparkles, Quote, Gem } from "lucide-react";
import { supabasePublic } from "@/lib/supabaseServer";
import ProductCard from "@/components/products/ProductCard";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import TiltCard from "@/components/home/TiltCard";
import Reveal from "@/components/home/Reveal";
import { getMockProducts } from "@/lib/mockProducts";
import type { Product } from "@/types";

export const revalidate = 60;

const CATEGORIES = [
  {
    key: "clothing",
    label: "01 — Apparel",
    title: "Native Kaftans",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCAORLLGefRdygHjtNQxmT43oQSl3-imjfPqa8450WVo8X5nIjyKR0VUqzU_vuDofpxEPYr4XLq82D8ER9gU_w7b_3jxEG2xvzKstC_Xh_cc3zS5BeOhzpe2OYpWfRIaMHtGjNabTDOL-tsR7WRP7W4ZrUJMmXIRnfqeneiwwNuDdPbwekFqKDhaz2E_gdrca5O5kLEpKAvGHL8EanRUSRBBm3Xl2Fuq7Mx-TLeOZDz0nm7W9PBntY2mTaACPKVysNbvEvRu43B_4"
  },
  {
    key: "shoes",
    label: "02 — Footwear",
    title: "Footwear",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHSzuBxb7ptroCAI841BnLmLo-VNcAq03TAoN8YQLd4EtnQOzvXcx7hF9tDP0lNENpeSxv2wodDG7GC5EzenCB5kaBmMs5ldp2MO31I-_dYp4NDuFJx0ekZ-RxZY54FI2bcmMFuVzfso9fR5LNJnzU2n6P7iKQzrYF7uaQHcbi3xtPbHNeOovq7kf-Dskjz_j6VMf3UxB5hAwalKDUA6Du87A_kJ3JZYjJSEUhx0E63UzXP2w1dkYEQtl2QMnvIhdT82lLsS8Aq-Q"
  },
  {
    key: "watches",
    label: "03 — Horology",
    title: "Watches",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80"
  },
  {
    key: "accessories",
    label: "04 — Objects",
    title: "Accessories",
    img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1400&q=80"
  }
];

const PILLARS = [
  {
    icon: Scissors,
    label: "Bespoke Atelier",
    body: "Hand-cut, hand-stitched. Each garment passes through a single tailor — start to finish."
  },
  {
    icon: Award,
    label: "Heritage Materials",
    body: "Italian wools, Aso-oke from Iseyin, sterling-thread embroidery sourced from family looms."
  },
  {
    icon: Truck,
    label: "White-Glove Delivery",
    body: "Concierge dispatch within 48 hours. International orders handled with insured customs clearance."
  }
];

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    const supabase = supabasePublic();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);
    featured = (data as Product[]) || [];
  } catch {
    featured = [];
  }

  if (featured.length === 0) {
    featured = getMockProducts({ limit: 8 });
  }

  return (
    <>
      <Hero />
      <Marquee />

      {/* Categories */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-stack-md mb-stack-lg">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
                The Wardrobe
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary mt-3 leading-[1.05]">
                Curated Essentials,
                <br />
                <span className="italic text-on-surface-variant">disciplined in form.</span>
              </h2>
            </div>
            <Link
              href="/shop"
              className="self-start md:self-end inline-flex items-center gap-2 text-label-sm uppercase tracking-[0.2em] text-primary border-b border-primary pb-1 hover:gap-4 transition-all"
            >
              View All Collections →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {CATEGORIES.map((c, i) => (
            <TiltCard
              key={c.key}
              href={`/shop?category=${c.key}`}
              label={c.label}
              title={c.title}
              img={c.img}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Editorial Lookbook */}
      <section className="bg-surface-container-low border-y border-outline-variant py-section-gap">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-stretch">
            <Reveal className="lg:col-span-7 relative">
              <div className="relative aspect-[4/5] lg:aspect-[4/4.5] overflow-hidden border border-outline-variant">
                <Image
                  src="https://images.unsplash.com/photo-1508243771214-6e95d137426b?auto=format&fit=crop&w=1400&q=80"
                  alt="Editorial Lookbook"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
              </div>
            </Reveal>

            <Reveal delay={0.15} className="lg:col-span-5 lg:-ml-16 lg:mt-stack-lg relative z-10 flex">
              <div className="bg-surface border border-outline-variant p-stack-md md:p-stack-lg flex flex-col justify-center w-full">
                <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
                  Lookbook · Chapter 01
                </span>
                <h2 className="font-display text-4xl md:text-5xl text-primary mt-3 leading-[1.05]">
                  The Quiet
                  <br />
                  <span className="italic">Authority</span>
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-stack-md">
                  Photographed at dawn in the marble courtyards of Marina,
                  Lagos. A study in stillness — the kaftan reframed as
                  architecture, the wearer as monument.
                </p>
                <Link
                  href="/shop"
                  className="mt-stack-lg self-start inline-flex items-center gap-3 group"
                >
                  <span className="text-label-sm uppercase tracking-[0.25em] text-primary">
                    Explore the Edit
                  </span>
                  <span className="h-px w-12 bg-primary group-hover:w-20 transition-all duration-500" />
                </Link>

                <div className="grid grid-cols-3 gap-2 mt-stack-lg pt-stack-md border-t border-outline-variant">
                  <Stat value="124" label="Looks" />
                  <Stat value="38" label="Tailors" />
                  <Stat value="11" label="Cities" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container mx-auto">
        <Reveal>
          <div className="text-center max-w-xl mx-auto mb-stack-lg">
            <span className="text-[10px] uppercase tracking-[0.3em] text-secondary inline-flex items-center gap-2">
              <Sparkles size={12} strokeWidth={1.5} /> Focus
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-primary mt-3 leading-[1.05]">
              Masterpiece Embroidery
            </h2>
            <p className="text-body-md text-on-surface-variant mt-stack-sm">
              A rotating curation of new arrivals and atelier favourites.
            </p>
          </div>
        </Reveal>

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06} y={20}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="border border-dashed border-outline-variant py-stack-lg px-stack-md text-center">
              <p className="text-secondary text-body-md">
                Configure Supabase &amp; add products in the admin to populate
                this gallery.
              </p>
            </div>
          </Reveal>
        )}
      </section>

      {/* Craftsmanship pillars */}
      <section className="bg-primary text-on-primary py-section-gap px-margin-mobile md:px-margin-desktop relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "32px 32px"
          }}
        />
        <div className="max-w-container mx-auto relative">
          <Reveal>
            <div className="text-center mb-stack-lg">
              <span className="text-[10px] uppercase tracking-[0.3em] text-on-primary/60">
                The House Code
              </span>
              <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">
                Three Pillars of Craft
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter md:gap-0 md:divide-x divide-on-primary/15">
            {PILLARS.map((p, i) => (
              <Reveal key={p.label} delay={i * 0.12} className="md:px-stack-md">
                <div className="flex flex-col items-start p-stack-md md:p-0">
                  <div className="w-12 h-12 border border-on-primary/30 flex items-center justify-center mb-stack-md">
                    <p.icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-on-primary/60">
                    0{i + 1}
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl mt-2 mb-stack-sm">
                    {p.label}
                  </h3>
                  <p className="text-body-md text-on-primary/80 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Founder's Note */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container mx-auto grid lg:grid-cols-12 gap-gutter items-center">
          <Reveal className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden border border-outline-variant">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80"
                alt="Founder — House of Merit"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-stack-md text-white">
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">Founder</p>
                <p className="font-display text-2xl mt-1">Adeyemi Merit</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-7 lg:pl-stack-lg">
            <div className="flex items-center gap-3 mb-stack-md">
              <Gem size={16} strokeWidth={1.5} className="text-primary" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
                A Note from the Founder
              </span>
            </div>

            <Quote
              size={28}
              strokeWidth={1}
              className="text-on-surface-variant mb-stack-md"
            />
            <p className="font-display text-2xl md:text-4xl text-primary leading-[1.2] italic">
              “We did not build Merit Wears to chase trends. We built it for
              the man who knows precisely who he is — and dresses for the
              decade ahead, not the season behind.
              <br />
              <br />
              Every stitch in this house carries a name, a hand, a history.
              Thank you for wearing our work.”
            </p>
            <div className="mt-stack-lg flex items-center gap-3">
              <span className="h-px w-12 bg-primary" />
              <p className="text-label-sm uppercase tracking-[0.25em] text-primary">
                Adeyemi Merit — Founder &amp; CEO, House of Merit
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Brand statement */}
      <section className="luxury-gradient text-white py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container mx-auto grid md:grid-cols-12 gap-gutter items-center">
          <Reveal className="md:col-span-7">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Coda
            </span>
            <h2 className="font-display text-4xl md:text-6xl mt-3 leading-[1.02]">
              The Art of
              <br />
              <span className="italic">Discipline.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="md:col-span-5">
            <p className="text-body-lg text-white/75 leading-relaxed">
              A heritage rooted in craftsmanship, distilled into a contemporary
              uniform of restraint, depth, and effortless elegance. We do not
              chase the season — we outlast it.
            </p>
            <Link
              href="/shop"
              className="mt-stack-md inline-flex items-center gap-3 group"
            >
              <span className="text-label-sm uppercase tracking-[0.25em] text-white">
                Enter the House
              </span>
              <span className="h-px w-12 bg-white group-hover:w-20 transition-all duration-500" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-primary leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.25em] text-secondary mt-1">
        {label}
      </p>
    </div>
  );
}
