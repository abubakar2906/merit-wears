import type { CartItem } from "@/types";

export interface WhatsAppOrderPayload {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  total: number;
  notes?: string;
}

export function buildWhatsAppURL(order: WhatsAppOrderPayload): string {
  const itemLines = order.items
    .map(
      (i) =>
        `• ${i.name} (${i.size}) x${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`
    )
    .join("%0A");

  const message = [
    `*NEW ORDER — ${order.orderNumber}*`,
    ``,
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.phone}`,
    `*Delivery Address:* ${order.address}`,
    ``,
    `*ITEMS:*`,
    itemLines,
    ``,
    `*ORDER TOTAL: ₦${order.total.toLocaleString()}*`,
    order.notes ? `*Notes:* ${order.notes}` : "",
    ``,
    `Please confirm availability and provide payment details.`
  ]
    .filter(Boolean)
    .join("\n");

  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
