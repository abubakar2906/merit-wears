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
import { getTranslations } from "next-intl/server";
import type { Product } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations("Home");

  const CATEGORIES = [
    {
      key: "native",
      label: "01 — Heritage",
      title: "Native Attires",
      img: "/landingpage-1.jpeg"
    },
    {
      key: "casual",
      label: "02 — Off-Duty",
      title: "Casual Wears",
      img: "/landingpage-casualwear.jpeg"
    },
    {
      key: "african-collection",
      label: "03 — Afrika",
      title: "African Collections",
      img: "/landingpage-africancollection.jpeg"
    },
    {
      key: "corporate",
      label: "04 — Boardroom",
      title: "Corporate Wears",
      img: "/landingpage-2.jpeg"
    },
    {
      key: "shoes",
      label: "05 — Footwear",
      title: "Foot-wears",
      img: "/landingpage-footwear.jpeg"
    },
    {
      key: "watches",
      label: "06 — Horology",
      title: "Watches",
      img: "/landingpage-watches.jpeg"
    },
    {
      key: "accessories",
      label: "07 — Objects",
      title: "Accessories",
      img: "/landingpage-accessories.jpeg"
    }
  ];

  const PILLARS = [
    {
      icon: Scissors,
      label: t("pillar1Label"),
      body: t("pillar1Desc")
    },
    {
      icon: Award,
      label: t("pillar2Label"),
      body: t("pillar2Desc")
    },
    {
      icon: Truck,
      label: t("pillar3Label"),
      body: t("pillar3Desc")
    }
  ];

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
                {t("categoriesLabel")}
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary mt-3 leading-[1.05]">
                {t("categoriesTitle1")}
                <br />
                <span className="italic text-on-surface-variant">{t("categoriesTitle2")}</span>
              </h2>
            </div>
            <Link
              href="/shop"
              className="self-start md:self-end inline-flex items-center gap-2 text-label-sm uppercase tracking-[0.2em] text-primary border-b border-primary pb-1 hover:gap-4 transition-all"
            >
              {t("categoriesLink")}
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
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
                  src="/landingpage-4.jpeg"
                  alt="Editorial Lookbook"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
              </div>
            </Reveal>

            <Reveal delay={0.15} className="lg:col-span-5 lg:-ml-16 lg:mt-stack-lg relative z-10 flex">
              <div className="bg-surface border border-outline-variant p-stack-md md:p-stack-lg flex flex-col justify-center w-full">
                <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
                  {t("lookbookLabel")}
                </span>
                <h2 className="font-display text-4xl md:text-5xl text-primary mt-3 leading-[1.05]">
                  {t("lookbookTitle1")}
                  <br />
                  <span className="italic">{t("lookbookTitle2")}</span>
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-stack-md">
                  {t("lookbookDesc")}
                </p>
                <Link
                  href="/shop"
                  className="mt-stack-lg self-start inline-flex items-center gap-3 group"
                >
                  <span className="text-label-sm uppercase tracking-[0.25em] text-primary">
                    {t("lookbookLink")}
                  </span>
                  <span className="h-px w-12 bg-primary group-hover:w-20 transition-all duration-500" />
                </Link>

                <div className="grid grid-cols-3 gap-2 mt-stack-lg pt-stack-md border-t border-outline-variant">
                  <Stat value="124" label={t("statLooks")} />
                  <Stat value="38" label={t("statTailors")} />
                  <Stat value="11" label={t("statCities")} />
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
              <Sparkles size={12} strokeWidth={1.5} /> {t("focusLabel")}
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-primary mt-3 leading-[1.05]">
              {t("focusTitle")}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-stack-sm">
              {t("focusDesc")}
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
                {t("emptyProducts")}
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
                {t("pillarsLabel")}
              </span>
              <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">
                {t("pillarsTitle")}
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
            <div className="relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container-low flex items-center justify-center">
              <Image
                src="/merit-logo.jpeg"
                alt="Merit Luxury Wears — House of Merit"
                width={320}
                height={320}
                className="object-contain w-4/5 h-4/5"
              />
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-7 lg:pl-stack-lg">
            <div className="flex items-center gap-3 mb-stack-md">
              <Gem size={16} strokeWidth={1.5} className="text-primary" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
                {t("founderNote")}
              </span>
            </div>

            <Quote
              size={28}
              strokeWidth={1}
              className="text-on-surface-variant mb-stack-md"
            />
            <p className="font-display text-2xl md:text-4xl text-primary leading-[1.2] italic">
              {t("founderQuote")}
            </p>
            <div className="mt-stack-lg flex items-center gap-3">
              <span className="h-px w-12 bg-primary" />
              <p className="text-label-sm uppercase tracking-[0.25em] text-primary">
                {t("founderRole")}
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
              {t("codaLabel")}
            </span>
            <h2 className="font-display text-4xl md:text-6xl mt-3 leading-[1.02]">
              {t("codaTitle1")}
              <br />
              <span className="italic">{t("codaTitle2")}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="md:col-span-5">
            <p className="text-body-lg text-white/75 leading-relaxed">
              {t("codaDesc")}
            </p>
            <Link
              href="/shop"
              className="mt-stack-md inline-flex items-center gap-3 group"
            >
              <span className="text-label-sm uppercase tracking-[0.25em] text-white">
                {t("codaLink")}
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
