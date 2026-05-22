import { createClient } from "@supabase/supabase-js";

// Fallbacks keep the build green when env vars are not yet provisioned
// (e.g. first Vercel preview build). Replace with real values in your
// hosting provider's env settings.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Browser client singleton
let browserSingleton: ReturnType<typeof createClient> | null = null;
export function supabaseBrowser() {
  if (!browserSingleton) {
    browserSingleton = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return browserSingleton;
}

export { createClient };
