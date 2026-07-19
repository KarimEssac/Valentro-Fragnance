import "server-only";

import {cookies} from "next/headers";
import {decode} from "next-auth/jwt";

type SessionIdentity = {
  id: string;
  role: string;
};

export async function getSessionIdentity(): Promise<SessionIdentity | null> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return null;

  const cookieStore = await cookies();
  const token =
    cookieStore.get("__Secure-next-auth.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  if (!token) return null;

  try {
    const payload = await decode({token, secret});
    return typeof payload?.role === "string" && typeof payload.id === "string"
      ? {id: payload.id, role: payload.role}
      : null;
  } catch {
    return null;
  }
}
