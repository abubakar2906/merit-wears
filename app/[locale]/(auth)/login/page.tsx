"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect_to") || "/account";
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError(
        "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart npm run dev."
      );
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <section className="hidden md:flex md:w-1/2 luxury-gradient relative items-center justify-center p-margin-desktop">
        <div className="relative z-10 text-center max-w-md">
          <h1 className="font-display text-display-lg text-white mb-stack-sm">Merit Luxury Wears</h1>
          <p className="text-body-lg text-white/80 italic mb-stack-lg">
            The art of discipline in modern tailoring.
          </p>
          <div className="h-px w-24 bg-white/30 mx-auto" />
        </div>
        <div className="absolute bottom-margin-desktop left-margin-desktop">
          <span className="text-label-sm text-white/60 tracking-[0.2em] uppercase">
            Est. 2024
          </span>
        </div>
      </section>

      <section className="flex-1 flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-section-gap bg-surface">
        <div className="w-full max-w-[400px]">
          <div className="mb-stack-lg">
            <h2 className="font-display text-headline-lg text-primary mb-1">Welcome back</h2>
            <p className="text-body-md text-secondary">
              Please enter your details to access your wardrobe.
            </p>
          </div>
          <form onSubmit={handle} className="space-y-stack-md">
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-line text-body-md"
                placeholder="name@meritwears.com"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label className="text-label-md uppercase text-primary">Password</label>
                <Link href="#" className="text-label-sm text-secondary hover:text-primary">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-line text-body-md"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-error text-label-md">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary text-label-md uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant text-center">
            <p className="text-body-md text-secondary">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
