import React from "react";
import { redirect } from "next/navigation";
import { supabaseRoute } from "@/lib/supabaseServer";
import { formatNaira } from "@/lib/formatCurrency";
import { Clock, CheckCircle2, Settings, Truck, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5" />,
  confirmed: <CheckCircle2 className="w-5 h-5" />,
  processing: <Settings className="w-5 h-5" />,
  shipped: <Truck className="w-5 h-5" />,
  delivered: <Package className="w-5 h-5" />,
  cancelled: <Clock className="w-5 h-5 text-error" /> // fallback
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Order Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_SEQUENCE = ["pending", "confirmed", "processing", "shipped", "delivered"];

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + 
         " • " + 
         d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function OrderTrackingPage({
  params: { order_number }
}: {
  params: { order_number: string };
}) {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect_to=/orders/${order_number}`);
  }

  // Fetch Order
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_tracking_events (
        status,
        note,
        created_at
      )
    `)
    .eq("order_number", order_number)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-margin-mobile">
        <h1 className="font-display text-headline-sm text-primary mb-2">Order Not Found</h1>
        <p className="text-secondary text-body-md mb-stack-md">
          We couldn't find an order with the reference {order_number}.
        </p>
        <Link href="/shop" className="btn-primary">
          Return to Shop
        </Link>
      </div>
    );
  }

  // Sort events chronologically
  const events = order.order_tracking_events?.sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ) || [];

  const currentStatusIndex = STATUS_SEQUENCE.indexOf(order.status);
  
  // Create timeline array
  const timeline = STATUS_SEQUENCE.map((status, index) => {
    const event = events.find((e: any) => e.status === status);
    return {
      status,
      label: STATUS_LABELS[status],
      isCompleted: index <= currentStatusIndex && order.status !== "cancelled",
      isCurrent: index === currentStatusIndex,
      date: event?.created_at ? formatDate(event.created_at) : null,
      note: event?.note
    };
  });

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container mx-auto py-stack-lg">
      <Link 
        href="/profile" 
        className="inline-flex items-center gap-2 text-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors mb-stack-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-lg">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
            Order Reference
          </span>
          <h1 className="font-display text-4xl text-primary mt-1">
            {order.order_number}
          </h1>
          <p className="text-body-sm text-secondary mt-2">
            Placed on {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        
        <div className="text-left md:text-right">
          <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
            Payment Status
          </span>
          <p className="font-medium text-body-md mt-1 capitalize flex items-center gap-2 md:justify-end">
            {order.payment_status === "paid" ? (
              <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Paid</span>
            ) : order.payment_status === "failed" ? (
              <span className="text-error flex items-center gap-1">Failed</span>
            ) : (
              <span className="text-warning flex items-center gap-1"><Clock className="w-4 h-4" /> Pending</span>
            )}
          </p>
          {order.payment_channel && (
            <p className="text-label-sm text-secondary uppercase mt-1">
              via {order.payment_channel.replace("_", " ")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Content: Tracking Timeline */}
        <div className="lg:col-span-2 space-y-stack-md">
          <div className="border border-outline-variant p-stack-md bg-surface">
            <h2 className="font-display text-headline-sm text-primary border-b border-outline-variant pb-stack-sm mb-stack-md">
              Tracking History
            </h2>

            {order.status === "cancelled" ? (
              <div className="bg-error/10 text-error p-4 flex items-start gap-3 border border-error/20">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Order Cancelled</p>
                  <p className="text-sm mt-1">
                    {events[events.length - 1]?.note || "This order was cancelled and will not be fulfilled."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative space-y-8 pl-4 py-4">
                {/* Vertical connecting line */}
                <div className="absolute left-7 top-6 bottom-6 w-px bg-outline-variant" />

                {timeline.map((step, idx) => (
                  <div key={step.status} className="relative flex items-start gap-6">
                    {/* Timeline Node */}
                    <div 
                      className={`
                        relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${step.isCompleted 
                          ? "bg-primary text-on-primary" 
                          : "bg-surface-container-high text-secondary border border-outline-variant"
                        }
                      `}
                    >
                      {step.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${!step.isCompleted && "opacity-50"}`}>
                      <p className="font-medium text-body-md text-primary flex items-center gap-2">
                        {step.label}
                        {step.isCurrent && (
                          <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                            Current
                          </span>
                        )}
                      </p>
                      {step.date && (
                        <p className="text-label-sm text-secondary mt-1">{step.date}</p>
                      )}
                      {step.note && (
                        <p className="text-body-sm text-secondary mt-2 bg-surface-container-low p-3 border border-outline-variant">
                          {step.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Delivery Info */}
          <div className="border border-outline-variant p-stack-md bg-surface">
             <h2 className="font-display text-headline-sm text-primary border-b border-outline-variant pb-stack-sm mb-stack-md">
              Delivery Details
            </h2>
            <div className="space-y-4 text-body-md">
              <div className="grid grid-cols-3 gap-4">
                <span className="text-secondary text-label-sm uppercase tracking-widest">Name</span>
                <span className="col-span-2 text-primary">{order.customer_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="text-secondary text-label-sm uppercase tracking-widest">Phone</span>
                <span className="col-span-2 text-primary">{order.customer_phone}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="text-secondary text-label-sm uppercase tracking-widest">Address</span>
                <span className="col-span-2 text-primary">{order.customer_address}</span>
              </div>
              {order.notes && (
                 <div className="grid grid-cols-3 gap-4">
                  <span className="text-secondary text-label-sm uppercase tracking-widest">Notes</span>
                  <span className="col-span-2 text-primary">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Order Summary */}
        <div className="lg:col-span-1">
          <div className="border border-outline-variant p-stack-md sticky top-24 bg-surface-container-lowest">
            <h2 className="font-display text-headline-sm text-primary border-b border-outline-variant pb-stack-sm mb-stack-md">
              Order Summary
            </h2>

            <div className="space-y-4 mb-stack-md">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between gap-4 text-body-sm">
                  <span className="flex-1 min-w-0">
                    <span className="truncate block text-primary font-medium">{item.name}</span>
                    <span className="text-secondary">
                      {item.size} × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-primary">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant pt-stack-sm space-y-2 text-body-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Subtotal</span>
                <span>{formatNaira(order.total_amount)}</span>
              </div>
              
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {order.promo_code && `(${order.promo_code})`}</span>
                  <span>-{formatNaira(order.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-outline-variant pt-2 mt-2 font-medium text-body-md">
                <span className="text-primary">Total Expected</span>
                <span className="text-primary">{formatNaira(order.amount_expected || order.total_amount - order.discount_amount)}</span>
              </div>

              {order.amount_paid > 0 && (
                 <div className="flex justify-between pt-1 text-success font-medium">
                  <span>Total Paid</span>
                  <span>{formatNaira(order.amount_paid)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
