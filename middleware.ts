import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed"
});

export async function middleware(req: NextRequest) {
  const res = intlMiddleware(req);
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.match(/^\/(en|fr)?\/?admin(\/|$)/);
  const isLoginRoute = pathname.match(/^\/(en|fr)?\/?admin\/login(\/|$)/);

  if (!isAdminRoute || isLoginRoute) return res;

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    const url = req.nextUrl.clone();
    const localeMatch = pathname.match(/^\/(en|fr)/);
    const locale = localeMatch ? localeMatch[1] : "";
    url.pathname = locale ? `/${locale}/admin/login` : "/admin/login";
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
    const localeMatch = pathname.match(/^\/(en|fr)/);
    const locale = localeMatch ? localeMatch[1] : "";
    url.pathname = locale ? `/${locale}` : "/";
    return NextResponse.redirect(url);
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
