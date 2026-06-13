"use client";

import { useState, useEffect } from "react";
import { formatNaira } from "@/lib/formatCurrency";
import { toast } from "sonner";
import { Copy, Edit2, Trash2, Plus, Loader2 } from "lucide-react";

type PromoCode = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  influencer_name: string | null;
  min_order_amount: number;
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    max_uses: "",
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
    influencer_name: "",
    min_order_amount: 0
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promos");
      if (!res.ok) throw new Error("Failed to fetch promos");
      const data = await res.json();
      setPromos(data.promos);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        valid_from: new Date(form.valid_from).toISOString(),
      };

      const url = editingId ? `/api/admin/promos/${editingId}` : "/api/admin/promos";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save promo");

      toast.success(editingId ? "Promo updated" : "Promo created");
      setShowModal(false);
      fetchPromos();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this promo code?")) return;
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to deactivate");
      toast.success("Promo deactivated");
      fetchPromos();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      max_uses: promo.max_uses?.toString() || "",
      valid_from: new Date(promo.valid_from).toISOString().split("T")[0],
      valid_until: promo.valid_until ? new Date(promo.valid_until).toISOString().split("T")[0] : "",
      influencer_name: promo.influencer_name || "",
      min_order_amount: promo.min_order_amount
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      code: "",
      type: "percentage",
      value: 10,
      max_uses: "",
      valid_from: new Date().toISOString().split("T")[0],
      valid_until: "",
      influencer_name: "",
      min_order_amount: 0
    });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-container mx-auto">
      <header className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-label-sm uppercase tracking-widest text-secondary">Operations</span>
          <h1 className="font-display text-headline-lg text-primary mt-1">Promo Codes</h1>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Promo
        </button>
      </header>

      <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3 text-label-sm uppercase">Code</th>
              <th className="px-4 py-3 text-label-sm uppercase">Discount</th>
              <th className="px-4 py-3 text-label-sm uppercase">Uses</th>
              <th className="px-4 py-3 text-label-sm uppercase">Influencer</th>
              <th className="px-4 py-3 text-label-sm uppercase">Status</th>
              <th className="px-4 py-3 text-right text-label-sm uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {promos.map((p) => (
              <tr key={p.id} className="hover:bg-background">
                <td className="px-4 py-3 font-medium text-primary">
                  {p.code}
                  <button 
                    onClick={() => { navigator.clipboard.writeText(p.code); toast.success("Copied"); }}
                    className="ml-2 text-secondary hover:text-primary transition-colors inline-block align-middle"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </td>
                <td className="px-4 py-3 text-sm">
                  {p.type === "percentage" ? `${p.value}%` : formatNaira(p.value)}
                  {p.min_order_amount > 0 && <span className="block text-[10px] text-secondary mt-1">Min: {formatNaira(p.min_order_amount)}</span>}
                </td>
                <td className="px-4 py-3 text-sm">
                  {p.uses_count} / {p.max_uses ? p.max_uses : "∞"}
                </td>
                <td className="px-4 py-3 text-sm text-secondary">
                  {p.influencer_name || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-1 uppercase tracking-widest rounded-sm ${p.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="p-2 text-secondary hover:text-primary transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {p.is_active && (
                    <button onClick={() => handleDeactivate(p.id)} className="p-2 text-secondary hover:text-error transition-colors" title="Deactivate">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-stack-lg text-center text-secondary">
                  No promo codes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface p-stack-lg w-full max-w-md border border-outline-variant shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-headline-sm text-primary mb-stack-md">
              {editingId ? "Edit Promo" : "Create Promo"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Code</label>
                <input 
                  type="text" 
                  value={form.code} 
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                  className="input-line w-full" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Type</label>
                  <select 
                    value={form.type} 
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })} 
                    className="input-line w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Value</label>
                  <input 
                    type="number" 
                    value={form.value} 
                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })} 
                    className="input-line w-full" 
                    required 
                    min="1" 
                  />
                </div>
              </div>
              <div>
                <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Min Order Amount (₦)</label>
                <input 
                  type="number" 
                  value={form.min_order_amount} 
                  onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) })} 
                  className="input-line w-full" 
                  min="0" 
                />
              </div>
              <div>
                <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Max Uses (Leave blank for unlimited)</label>
                <input 
                  type="number" 
                  value={form.max_uses} 
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })} 
                  className="input-line w-full" 
                  min="1" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Valid From</label>
                  <input 
                    type="date" 
                    value={form.valid_from} 
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })} 
                    className="input-line w-full" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Valid Until (Optional)</label>
                  <input 
                    type="date" 
                    value={form.valid_until} 
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })} 
                    className="input-line w-full" 
                  />
                </div>
              </div>
              <div>
                <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">Influencer Name (Optional)</label>
                <input 
                  type="text" 
                  value={form.influencer_name} 
                  onChange={(e) => setForm({ ...form, influencer_name: e.target.value })} 
                  className="input-line w-full" 
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-6">
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
