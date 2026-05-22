import { cookies } from "next/headers";
import {
  createRouteHandlerClient,
  createServerComponentClient
} from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Server component client (cookies-aware, RLS as user)
export function supabaseServer() {
  return createServerComponentClient({ cookies });
}

// Route handler client (cookies-aware, RLS as user)
export function supabaseRoute() {
  return createRouteHandlerClient({ cookies });
}

// Privileged client (server-only). Bypasses RLS. Use sparingly.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
