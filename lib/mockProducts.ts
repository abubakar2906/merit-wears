import type { Product } from "@/types";

const now = new Date().toISOString();

const make = (
  i: number,
  p: Omit<Product, "id" | "created_at" | "updated_at" | "is_active" | "image_urls"> & {
    images: string[];
  }
): Product => ({
  id: `mock-${i}`,
  name: p.name,
  description: p.description,
  price: p.price,
  category: p.category,
  image_urls: p.images,
  sizes: p.sizes,
  stock_quantity: p.stock_quantity,
  is_featured: p.is_featured,
  is_active: true,
  created_at: now,
  updated_at: now
});

// Curated Unsplash imagery — luxury menswear, footwear, horology, accessories.
const IMG = {
  // Native kaftans / agbada / luxury menswear
  kaftan1: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?auto=format&fit=crop&w=1200&q=80",
  kaftan2: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80",
  kaftan3: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=1200&q=80",
  kaftan4: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  kaftan5: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
  // Footwear
  shoe1: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1200&q=80",
  shoe2: "https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=1200&q=80",
  shoe3: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=80",
  shoe4: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  // Watches
  watch1: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  watch2: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80",
  watch3: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
  // Accessories
  acc1: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80", // sunglasses
  acc2: "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?auto=format&fit=crop&w=1200&q=80", // wallet
  acc3: "https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=1200&q=80", // cufflinks
  acc4: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1200&q=80"  // belt / leather goods
};

export const MOCK_PRODUCTS: Product[] = [
  make(1, {
    name: "Sterling Navy Kaftan",
    description:
      "Hand-tailored agbada in midnight wool-blend. Sterling-thread embroidery at the placket and cuffs. Cut for a relaxed, columnar silhouette.",
    price: 285000,
    category: "clothing",
    images: [IMG.kaftan1, IMG.kaftan2],
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock_quantity: 12,
    is_featured: true
  }),
  make(2, {
    name: "Onyx Ceremonial Agbada",
    description:
      "Three-piece ensemble — flowing outer robe, fitted inner sokoto, and cap. Onyx-black aso-oke with tonal silver thread.",
    price: 420000,
    category: "clothing",
    images: [IMG.kaftan2, IMG.kaftan3],
    sizes: ["M", "L", "XL", "XXL"],
    stock_quantity: 6,
    is_featured: true
  }),
  make(3, {
    name: "Marina Linen Kaftan",
    description:
      "Lightweight Italian linen, dyed in atelier indigo. An everyday silhouette for the modern wardrobe.",
    price: 165000,
    category: "clothing",
    images: [IMG.kaftan3, IMG.kaftan4],
    sizes: ["S", "M", "L", "XL"],
    stock_quantity: 18,
    is_featured: false
  }),
  make(4, {
    name: "House Tunic — Ivory",
    description:
      "Minimalist tunic-cut kaftan in ivory cotton-silk, finished with a single navy contrast pleat at the hem.",
    price: 145000,
    category: "clothing",
    images: [IMG.kaftan4, IMG.kaftan5],
    sizes: ["S", "M", "L", "XL"],
    stock_quantity: 10,
    is_featured: false
  }),

  make(5, {
    name: "Atelier Oxford — Midnight",
    description:
      "Whole-cut Oxford in mirror-polished navy calfskin. Hand-lasted in our atelier over a week of dedicated craftsmanship.",
    price: 220000,
    category: "shoes",
    images: [IMG.shoe1, IMG.shoe2],
    sizes: ["41", "42", "43", "44", "45"],
    stock_quantity: 8,
    is_featured: true
  }),
  make(6, {
    name: "Heritage Loafer — Sable",
    description:
      "Penny-strap loafer in burnished sable leather. Blake-stitched, leather sole.",
    price: 185000,
    category: "shoes",
    images: [IMG.shoe2, IMG.shoe3],
    sizes: ["40", "41", "42", "43", "44", "45"],
    stock_quantity: 14,
    is_featured: false
  }),
  make(7, {
    name: "Court Sneaker — Bone",
    description:
      "Low-profile court sneaker in full-grain bone leather. Italian construction.",
    price: 145000,
    category: "shoes",
    images: [IMG.shoe3, IMG.shoe4],
    sizes: ["40", "41", "42", "43", "44", "45"],
    stock_quantity: 22,
    is_featured: false
  }),

  make(8, {
    name: "Sterling Chronograph 41",
    description:
      "Automatic chronograph, 41mm. Sapphire crystal, sterling-applied indices, navy lacquer dial.",
    price: 980000,
    category: "watches",
    images: [IMG.watch1, IMG.watch2],
    sizes: ["41mm"],
    stock_quantity: 3,
    is_featured: true
  }),
  make(9, {
    name: "Atelier Dress Watch — Onyx",
    description:
      "Slim 38mm dress piece. Hand-finished case, alligator strap. Quiet, considered, eternal.",
    price: 640000,
    category: "watches",
    images: [IMG.watch2, IMG.watch3],
    sizes: ["38mm"],
    stock_quantity: 5,
    is_featured: false
  }),
  make(10, {
    name: "Heritage GMT — Steel",
    description:
      "Two-tone GMT with brushed steel bracelet. A traveller's piece with restraint.",
    price: 720000,
    category: "watches",
    images: [IMG.watch3, IMG.watch1],
    sizes: ["40mm"],
    stock_quantity: 4,
    is_featured: false
  }),

  make(11, {
    name: "Editor's Sunglasses",
    description:
      "Acetate frame, hand-polished, with custom navy gradient lenses. Italian-made.",
    price: 95000,
    category: "accessories",
    images: [IMG.acc1, IMG.acc4],
    sizes: ["One Size"],
    stock_quantity: 16,
    is_featured: true
  }),
  make(12, {
    name: "Sterling Bifold Wallet",
    description:
      "Bridle leather bifold, edge-painted by hand. Six card slots and twin note compartments.",
    price: 78000,
    category: "accessories",
    images: [IMG.acc2, IMG.acc3],
    sizes: ["One Size"],
    stock_quantity: 24,
    is_featured: false
  }),
  make(13, {
    name: "House Cufflinks — Silver",
    description:
      "Solid sterling silver cufflinks engraved with the Merit crest. Presented in a navy cloth pouch.",
    price: 65000,
    category: "accessories",
    images: [IMG.acc3, IMG.acc1],
    sizes: ["One Size"],
    stock_quantity: 30,
    is_featured: false
  }),
  make(14, {
    name: "Bridle Belt — Onyx",
    description:
      "1.25\" bridle leather belt with brushed-steel buckle. Built for a lifetime.",
    price: 58000,
    category: "accessories",
    images: [IMG.acc4, IMG.acc2],
    sizes: ["32", "34", "36", "38", "40"],
    stock_quantity: 20,
    is_featured: false
  })
];

export function getMockProducts(opts?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Product[] {
  let out = [...MOCK_PRODUCTS];
  if (opts?.category && opts.category !== "all") {
    out = out.filter((p) => p.category === opts.category);
  }
  if (opts?.featured) out = out.filter((p) => p.is_featured);
  if (opts?.limit) out = out.slice(0, opts.limit);
  return out;
}
