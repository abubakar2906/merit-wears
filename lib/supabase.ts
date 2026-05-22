import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
