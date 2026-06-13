"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/formatCurrency";
import type { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

const STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

const VALID_NEXT_STATES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "processing", "cancelled"],
  processing: ["processing", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"]
};

export default function OrdersClient({
  initial,
  status
}: {
  initial: Order[];
  status: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
      toast.success(`Order status updated to ${newStatus}`);
    } else {
      toast.error(data.error || "Failed to update status");
    }
  };

  const filteredOrders = orders.filter(
    (o) => paymentFilter === "all" || o.payment_status === paymentFilter
  );

  return (
    <div className="max-w-container mx-auto">
      <header className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-label-sm uppercase tracking-widest text-secondary">Operations</span>
          <h1 className="font-display text-headline-lg text-primary mt-1">Orders</h1>
        </div>
        
        {/* Payment Status Filter */}
        <div>
          <label className="text-label-sm uppercase tracking-widest text-secondary block mb-1">
            Payment Status
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input-line text-label-sm uppercase tracking-widest bg-transparent py-2"
          >
            <option value="all">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-stack-md">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3 py-2 text-label-sm uppercase tracking-widest border ${
              status === s
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-primary hover:bg-surface-container"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3 text-label-sm uppercase">Order</th>
              <th className="px-4 py-3 text-label-sm uppercase">Customer</th>
              <th className="px-4 py-3 text-label-sm uppercase">Payment</th>
              <th className="px-4 py-3 text-label-sm uppercase">Total</th>
              <th className="px-4 py-3 text-label-sm uppercase">Status</th>
              <th className="px-4 py-3 text-label-sm uppercase">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filteredOrders.map((o) => {
              const validTransitions = VALID_NEXT_STATES[o.status] || [o.status];
              return (
                <Fragment key={o.id}>
                  <tr
                    className="hover:bg-background cursor-pointer"
                    onClick={() => setExpanded((p) => (p === o.id ? null : o.id))}
                  >
                    <td className="px-4 py-3">
                      <div className="text-label-md">{o.order_number}</div>
                      <Link 
                        href={`/orders/${o.order_number}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] uppercase tracking-widest text-secondary hover:text-primary flex items-center gap-1 mt-1"
                      >
                        Track <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.customer_name}</div>
                      <div className="text-secondary text-sm">{o.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 uppercase tracking-widest rounded-sm ${
                        o.payment_status === 'paid' ? 'bg-success/10 text-success' :
                        o.payment_status === 'failed' ? 'bg-error/10 text-error' :
                        o.payment_status === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-surface-container text-secondary'
                      }`}>
                        {o.payment_status}
                      </span>
                      {o.payment_channel && (
                        <div className="text-[10px] text-secondary mt-1">{o.payment_channel}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">{formatNaira(o.total_amount - (o.discount_amount || 0))}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {o.status === "delivered" || o.status === "cancelled" ? (
                        <span className="text-label-sm uppercase tracking-widest text-secondary">
                          {o.status}
                        </span>
                      ) : (
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                          className="input-line text-label-sm uppercase tracking-widest border-b border-outline-variant py-1 bg-transparent"
                        >
                          {validTransitions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-secondary text-sm">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`https://wa.me/${(o.customer_phone || "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-label-sm uppercase tracking-widest text-primary hover:underline"
                      >
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-surface-container-low">
                      <td colSpan={7} className="px-4 py-stack-md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                          <div>
                            <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">
                              Delivery Address
                            </p>
                            <p className="text-sm">{o.customer_address}</p>
                          </div>
                          <div>
                            <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">
                              Notes
                            </p>
                            <p className="text-sm">{o.notes || "—"}</p>
                          </div>
                          <div>
                            <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">
                              Items
                            </p>
                            <ul className="space-y-1 text-sm">
                              {o.items.map((it, i) => (
                                <li key={i}>
                                  {it.name} ({it.size}) × {it.quantity} —{" "}
                                  {formatNaira(it.price * it.quantity)}
                                </li>
                              ))}
                            </ul>
                            {o.discount_amount > 0 && (
                              <div className="mt-2 text-sm text-success">
                                Discount ({o.promo_code}): -{formatNaira(o.discount_amount)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-stack-lg text-center text-secondary">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
