import {getToken} from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

import {defaultLocale, isLocale, locales} from "@/lib/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
});

function localeFromPathname(pathname: string) {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : defaultLocale;
}

export default async function middleware(request: NextRequest) {
  const locale = localeFromPathname(request.nextUrl.pathname);
  const adminPrefix = `/${locale}/admin`;

  if (request.nextUrl.pathname.startsWith(adminPrefix)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (token?.role !== "ADMIN") {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]
};
