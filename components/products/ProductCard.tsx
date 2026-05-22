import Link from "next/link";
import Image from "next/image";
import { formatNaira } from "@/lib/formatCurrency";
import type { Product } from "@/types";

export default function ProductCard({ product }: { product: Product }) {
  const img = product.image_urls?.[0] || "/placeholder.png";
  return (
    <Link href={`/shop/${product.id}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[3/4] bg-surface-variant overflow-hidden border border-outline-variant">
        <Image
          src={img}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.stock_quantity === 0 && (
          <span className="absolute top-3 left-3 bg-primary text-on-primary text-label-sm uppercase px-2 py-1 tracking-widest">
            Sold Out
          </span>
        )}
      </div>
      <div className="flex justify-between items-start border-b border-outline-variant pb-4">
        <div>
          <h3 className="font-body text-body-lg text-primary mb-1">{product.name}</h3>
          <p className="text-label-sm text-secondary uppercase tracking-widest">
            {product.category}
          </p>
        </div>
        <span className="font-body text-body-md text-primary">
          {formatNaira(product.price)}
        </span>
      </div>
    </Link>
  );
}
