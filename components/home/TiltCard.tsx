"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

export default function TiltCard({
  href,
  label,
  title,
  img,
  index = 0
}: {
  href: string;
  label: string;
  title: string;
  img: string;
  index?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 22 });
  const sy = useSpring(my, { stiffness: 220, damping: 22 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [8, -8]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-6, 6]);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
    >
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative block aspect-[3/4] overflow-hidden border border-outline-variant"
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="w-full h-full"
        >
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-[1.2s] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-transparent" />
          <div className="absolute inset-0 ring-0 group-hover:ring-1 ring-white/30 transition-all duration-500" />

          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/80 bg-white/10 backdrop-blur px-3 py-1 border border-white/30">
              {label}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end justify-between">
            <h3 className="font-display text-3xl md:text-4xl text-white leading-none drop-shadow">
              {title}
            </h3>
            <span className="w-11 h-11 inline-flex items-center justify-center bg-white text-primary translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
              <ArrowUpRight size={18} strokeWidth={1.5} />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
