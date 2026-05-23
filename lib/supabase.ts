import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Fallbacks keep the build green when env vars are not yet provisioned
// (e.g. first Vercel preview build). Replace with real values in your
// hosting provider's env settings.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export function isSupabaseConfigured() {
  return (
    url !== "https://placeholder.supabase.co" &&
    anon !== "placeholder-anon-key" &&
    url.startsWith("https://") &&
    url.includes(".supabase.co")
  );
}

// Browser client singleton.
// Uses the auth-helpers client so the session is stored in cookies (not just
// localStorage). This lets server routes / middleware / RSCs read the session
// via `createRouteHandlerClient` and `createServerComponentClient`.
let browserSingleton: ReturnType<typeof createClientComponentClient> | null =
  null;
export function supabaseBrowser() {
  if (!browserSingleton) {
    browserSingleton = createClientComponentClient({
      supabaseUrl: url,
      supabaseKey: anon
    });
  }
  return browserSingleton;
}

export { createClient };
