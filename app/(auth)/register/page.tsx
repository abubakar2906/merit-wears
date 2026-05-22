"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/account");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <section className="hidden md:flex md:w-1/2 luxury-gradient items-center justify-center p-margin-desktop">
        <div className="text-center max-w-md">
          <h1 className="font-display text-display-lg text-white mb-stack-sm">Merit Wears</h1>
          <p className="text-body-lg text-white/80 italic mb-stack-lg">
            Experience the curated excellence of our latest collections.
          </p>
        </div>
      </section>

      <section className="flex-1 flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-section-gap bg-surface">
        <div className="w-full max-w-[400px]">
          <div className="mb-stack-lg">
            <h2 className="font-display text-headline-lg text-primary mb-1">Join Merit</h2>
            <p className="text-body-md text-secondary">
              Create your account to begin curating.
            </p>
          </div>
          <form onSubmit={handle} className="space-y-stack-md">
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-line text-body-md"
                placeholder="Christian Dior"
              />
            </div>
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-line text-body-md"
              />
            </div>
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-line text-body-md"
              />
            </div>
            <div>
              <label className="text-label-md uppercase text-primary block mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-line text-body-md"
              />
            </div>

            {error && <p className="text-error text-label-md">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary text-label-md uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Account"}
            </button>
          </form>
          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant text-center">
            <p className="text-body-md text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
