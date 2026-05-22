"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/formatCurrency";
import type { Order, OrderStatus } from "@/types";

const STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

export default function OrdersClient({
  initial,
  status
}: {
  initial: Order[];
  status: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
  };

  return (
    <div className="max-w-container mx-auto">
      <header className="mb-stack-lg">
        <span className="text-label-sm uppercase tracking-widest text-secondary">Operations</span>
        <h1 className="font-display text-headline-lg text-primary mt-1">Orders</h1>
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
              <th className="px-4 py-3 text-label-sm uppercase">Phone</th>
              <th className="px-4 py-3 text-label-sm uppercase">Items</th>
              <th className="px-4 py-3 text-label-sm uppercase">Total</th>
              <th className="px-4 py-3 text-label-sm uppercase">Status</th>
              <th className="px-4 py-3 text-label-sm uppercase">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {orders.map((o) => (
              <Fragment key={o.id}>
                <tr
                  className="hover:bg-background cursor-pointer"
                  onClick={() => setExpanded((p) => (p === o.id ? null : o.id))}
                >
                  <td className="px-4 py-3 text-label-md">{o.order_number}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3 text-secondary">{o.customer_phone}</td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3 font-bold">{formatNaira(o.total_amount)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                      className="input-line text-label-sm uppercase tracking-widest border-b border-outline-variant"
                    >
                      {STATUSES.filter((s) => s !== "all").map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-secondary">
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
                    <td colSpan={8} className="px-4 py-stack-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        <div>
                          <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">
                            Delivery Address
                          </p>
                          <p>{o.customer_address}</p>
                        </div>
                        <div>
                          <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">
                            Notes
                          </p>
                          <p>{o.notes || "—"}</p>
                        </div>
                        <div>
                          <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">
                            Items
                          </p>
                          <ul className="space-y-1">
                            {o.items.map((it, i) => (
                              <li key={i}>
                                {it.name} ({it.size}) × {it.quantity} —{" "}
                                {formatNaira(it.price * it.quantity)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-stack-lg text-center text-secondary">
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
