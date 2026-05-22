"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Inventory" },
  { href: "/admin/customers", label: "Customers" }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col gap-3 p-gutter h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant z-50">
      <div className="mb-stack-lg px-2">
        <h1 className="font-display text-headline-md text-primary">Merit Admin</h1>
        <p className="text-label-sm text-secondary tracking-widest uppercase">
          Management Portal
        </p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {links.map((l) => {
          const active =
            pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-4 py-3 transition ${
                active
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="text-label-md uppercase tracking-widest">{l.label}</span>
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high text-label-md uppercase tracking-widest text-left"
        >
          Sign Out
        </button>
      </nav>
    </aside>
  );
}
