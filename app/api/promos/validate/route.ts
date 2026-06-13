import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabaseServer";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

// Create a new ratelimiter that allows 10 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "meritwears:ratelimit:promo",
});

export async function POST(req: NextRequest) {
  const supabase = supabaseRoute();
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting
  const identifier = user.id;
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    // If Redis fails, we should probably let them through but log the error
    // Alternatively, we can fail closed. Failing open is better for UX.
  }

  const body = await req.json();
  const { code, cart_total } = body;

  if (!code || typeof cart_total !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Use the RPC to validate the promo code safely
  const { data: rpcResult, error } = await supabase.rpc("validate_promo", {
    p_code: code,
    p_cart_total: cart_total
  });

  if (error) {
    console.error("Promo validation RPC error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }

  return NextResponse.json(rpcResult);
}
