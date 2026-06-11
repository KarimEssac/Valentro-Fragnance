import {createHmac, randomBytes, timingSafeEqual} from "crypto";

export const csrfCookieName = "valentro-xsrf";

function csrfSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required for CSRF protection");
  }

  return secret ?? "valentro-development-csrf-secret";
}

function signToken(token: string) {
  return createHmac("sha256", csrfSecret()).update(token).digest("hex");
}

export function createCsrfToken() {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    cookieValue: `${token}.${signToken(token)}`
  };
}

export function validateCsrfToken(token: string | null, cookieValue?: string) {
  if (!token || !cookieValue) return false;

  const [cookieToken, signature] = cookieValue.split(".");
  if (!cookieToken || !signature || cookieToken !== token) return false;

  const expectedSignature = signToken(cookieToken);
  const actual = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
