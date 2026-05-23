"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message || "Invalid admin credentials.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        `Could not load profile (${profileError.message}). Ensure the profiles table exists and RLS policies are installed.`
      );
      return;
    }

    if (!profile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        `No profile row exists for user id ${data.user.id}. In Supabase SQL editor run: insert into public.profiles (id, email, role) values ('${data.user.id}', '${data.user.email}', 'admin');`
      );
      return;
    }

    if ((profile as any).role !== "admin") {
      const role = (profile as any).role || "unknown";
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        `Account ${data.user.email} has role "${role}". In Supabase SQL editor run: update public.profiles set role = 'admin' where id = '${data.user.id}';`
      );
      return;
    }

    setLoading(false);
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center px-margin-mobile py-section-gap">
      <div className="w-full max-w-[440px] bg-surface border border-white/20 p-stack-lg shadow-2xl">
        <div className="mb-stack-lg text-center">
          <div className="mx-auto mb-stack-sm w-14 h-14 border border-outline-variant flex items-center justify-center text-primary">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-secondary">
            Management Portal
          </span>
          <h1 className="font-display text-headline-lg text-primary mt-2">
            Admin Login
          </h1>
          <p className="text-body-md text-secondary mt-2">
            Sign in with an account assigned the admin role.
          </p>
        </div>

        <form onSubmit={handle} className="space-y-stack-md">
          <div>
            <label className="text-label-md uppercase text-primary block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-line text-body-md"
              placeholder="admin@meritwears.com"
            />
          </div>

          <div>
            <label className="text-label-md uppercase text-primary block mb-1">
              Password
            </label>
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
            {loading ? "Verifying…" : "Enter Dashboard"}
          </button>
        </form>

        <div className="mt-stack-lg pt-stack-md border-t border-outline-variant text-center">
          <Link href="/" className="text-label-sm uppercase tracking-widest text-secondary hover:text-primary">
            Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
