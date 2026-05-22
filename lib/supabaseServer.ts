import { cookies } from "next/headers";
import {
  createRouteHandlerClient,
  createServerComponentClient
} from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Build-safe fallbacks so prerender doesn't crash without env vars.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const SUPABASE_SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

// Server component client (cookies-aware, RLS as user)
export function supabaseServer() {
  return createServerComponentClient({ cookies }, {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON
  });
}

// Route handler client (cookies-aware, RLS as user)
export function supabaseRoute() {
  return createRouteHandlerClient({ cookies }, {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON
  });
}

// Privileged client (server-only). Bypasses RLS. Use sparingly.
export function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
