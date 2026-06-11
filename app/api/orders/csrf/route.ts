import {NextResponse} from "next/server";

import {createCsrfToken, csrfCookieName} from "@/lib/csrf";

export async function GET() {
  const {token, cookieValue} = createCsrfToken();
  const response = NextResponse.json({token});

  response.cookies.set(csrfCookieName, cookieValue, {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
