"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/formatCurrency";
import ProductForm from "@/components/products/ProductForm";
import type { Product } from "@/types";

export default function ProductsClient({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initial);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/products?all=1");
    const data = await res.json();
    setProducts(data.products || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active })
    });
    refresh();
  };

  return (
    <div className="max-w-container mx-auto">
      <header className="flex justify-between items-center mb-stack-lg">
        <div>
          <span className="text-label-sm uppercase tracking-widest text-secondary">Catalog</span>
          <h1 className="font-display text-headline-lg text-primary mt-1">Products</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-on-primary px-4 py-2 text-label-md uppercase tracking-widest"
        >
          + Add Product
        </button>
      </header>

      <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3 text-label-sm uppercase">Name</th>
              <th className="px-4 py-3 text-label-sm uppercase">Category</th>
              <th className="px-4 py-3 text-label-sm uppercase">Price</th>
              <th className="px-4 py-3 text-label-sm uppercase">Stock</th>
              <th className="px-4 py-3 text-label-sm uppercase">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-background">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-secondary capitalize">{p.category}</td>
                <td className="px-4 py-3 font-bold">{formatNaira(p.price)}</td>
                <td
                  className={`px-4 py-3 ${
                    p.stock_quantity === 0
                      ? "text-error font-bold"
                      : p.stock_quantity < 5
                      ? "text-error"
                      : ""
                  }`}
                >
                  {p.stock_quantity}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`px-2 py-1 text-[10px] uppercase tracking-tighter font-bold border ${
                      p.is_active
                        ? "bg-primary text-on-primary border-primary"
                        : "border-outline-variant text-secondary"
                    }`}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-label-sm uppercase tracking-widest text-secondary hover:text-primary mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-label-sm uppercase tracking-widest text-error hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-stack-lg text-center text-secondary">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ProductForm
          product={editing || undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
