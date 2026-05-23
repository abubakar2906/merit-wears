"use client";

import { useState } from "react";
import type { Product, Category } from "@/types";

const CATEGORIES: Category[] = [
  "native",
  "casual",
  "corporate",
  "shoes",
  "watches",
  "accessories"
];

export default function ProductForm({
  product,
  onClose,
  onSaved
}: {
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState<number | "">(product?.price ?? "");
  const [category, setCategory] = useState<Category>((product?.category as Category) ?? "native");
  const [sizes, setSizes] = useState<string>((product?.sizes ?? []).join(","));
  const [stock, setStock] = useState<number | "">(product?.stock_quantity ?? 0);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.image_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const f of Array.from(files).slice(0, 5 - imageUrls.length)) {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!r.ok) throw new Error("Upload failed");
        const { url } = await r.json();
        setImageUrls((prev) => [...prev, url]);
      }
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!name || !price || !category || imageUrls.length === 0) {
      setError("Name, price, category, and at least 1 image are required.");
      return;
    }
    setSaving(true);
    const body = {
      name,
      description,
      price: Number(price),
      category,
      sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      stock_quantity: Number(stock || 0),
      is_active: isActive,
      image_urls: imageUrls
    };
    const res = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed");
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-outline-variant">
        <div className="flex justify-between items-center p-stack-md border-b border-outline-variant">
          <h2 className="font-display text-headline-md text-primary">
            {product ? "Edit Product" : "New Product"}
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-primary text-2xl">
            ×
          </button>
        </div>
        <div className="p-stack-md space-y-stack-md">
          <div>
            <label className="text-label-md uppercase text-primary block mb-1">Name</label>
            <input className="input-line text-body-md" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-label-md uppercase text-primary block mb-1">Description</label>
            <textarea
              rows={3}
              className="input-line text-body-md resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-stack-md">
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Price (₦)</label>
              <input
                type="number"
                className="input-line text-body-md"
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Stock</label>
              <input
                type="number"
                className="input-line text-body-md"
                value={stock}
                onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-stack-md">
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Category</label>
              <select
                className="input-line text-body-md"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">
                Sizes (comma-separated)
              </label>
              <input
                className="input-line text-body-md"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="S,M,L,XL"
              />
            </div>
          </div>

          <div>
            <label className="text-label-md uppercase text-primary block mb-1">
              Images (up to 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => upload(e.target.files)}
              disabled={uploading || imageUrls.length >= 5}
              className="text-body-md"
            />
            {uploading && <p className="text-label-sm text-secondary mt-1">Uploading…</p>}
            <div className="grid grid-cols-5 gap-2 mt-2">
              {imageUrls.map((u, i) => (
                <div key={i} className="relative aspect-square bg-surface-variant border border-outline-variant">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrls((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-0 right-0 bg-primary text-on-primary text-xs w-6 h-6"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-label-md uppercase tracking-widest">Active</span>
          </label>

          {error && <p className="text-error text-label-md">{error}</p>}

          <div className="flex gap-2 pt-stack-md border-t border-outline-variant">
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 bg-primary text-on-primary py-3 text-label-md uppercase tracking-widest disabled:opacity-60"
            >
              {saving ? "Saving…" : product ? "Update" : "Create"}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-3 border border-outline-variant text-label-md uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
