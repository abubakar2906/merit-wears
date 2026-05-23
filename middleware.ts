import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return res;

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(url);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  if ((profile as any)?.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"]
};
