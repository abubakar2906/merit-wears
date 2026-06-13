"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("Hero");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const words = t("headline").split(" ");

  return (
    <section
      ref={ref}
      className="relative w-full h-[92vh] min-h-[640px] overflow-hidden bg-primary"
    >
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <Image
          src="/landingpage-5.jpeg"
          alt="Merit Luxury Wears Editorial"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-transparent to-primary/30" />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col justify-end pb-stack-lg md:pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container mx-auto"
      >
        <div className="grid md:grid-cols-12 gap-gutter items-end">
          <div className="md:col-span-8 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-3 mb-stack-md"
            >
              <span className="h-px w-12 bg-white/60" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/80">
                {t("collection")}
              </span>
            </motion.div>

            <h1 className="font-display text-white leading-[0.95] text-5xl md:text-7xl lg:text-8xl tracking-tight">
              {words.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
                  <motion.span
                    className="inline-block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      delay: 0.4 + i * 0.08,
                      duration: 0.9,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="text-body-lg text-white/80 max-w-xl mt-stack-md"
            >
              {t("subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.15 }}
              className="flex flex-wrap items-center gap-3 mt-stack-lg"
            >
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-white text-primary px-8 py-4 text-label-md uppercase tracking-[0.2em] hover:bg-primary hover:text-on-primary transition-colors border border-white"
              >
                {t("shop")}
                <span className="w-4 h-px bg-primary group-hover:bg-on-primary group-hover:w-8 transition-all duration-300" />
              </Link>
              <Link
                href="/shop?category=clothing"
                className="inline-flex items-center gap-3 px-8 py-4 text-label-md uppercase tracking-[0.2em] text-white border border-white/30 hover:border-white transition-colors"
              >
                {t("native")}
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 1.2 }}
            className="hidden md:block md:col-span-4 lg:col-span-4 lg:col-start-9"
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/20 p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-3">
                {t("atelierNoteTitle")}
              </p>
              <p className="font-display text-2xl text-white leading-snug">
                {t("atelierNote")}
              </p>
              <p className="mt-4 text-label-sm uppercase tracking-[0.2em] text-white/60">
                {t("atelierAuthor")}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/70"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">{t("scroll")}</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
}
