"use client";

import {signIn} from "next-auth/react";
import {useLocale} from "next-intl";
import {useRouter, useSearchParams} from "next/navigation";
import type {FormEvent} from "react";
import {useMemo, useState} from "react";

const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

function cleanEmail(value: string) {
  return value
    .toLowerCase()
    .replace(/[<>{}[\]$;'"`|\\\s]/g, "")
    .slice(0, 120);
}

type LoginClientProps = {
  defaultCallbackUrl?: string;
};

export default function LoginClient({defaultCallbackUrl}: LoginClientProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminEmail = Boolean(adminEmail && email.toLowerCase().trim() === adminEmail);
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? defaultCallbackUrl ?? `/${locale}`,
    [locale, searchParams, defaultCallbackUrl]
  );

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    if (adminEmail && targetEmail === adminEmail) {
      setIsSubmitting(true);
      const result = (await signIn("credentials", {
        email: targetEmail,
        password,
        redirect: false,
        callbackUrl
      })) as {ok?: boolean; url?: string | null} | undefined;

      setIsSubmitting(false);

      if (!result?.ok) {
        setStatus("Admin password is incorrect.");
        return;
      }

      window.location.href = callbackUrl;
      return;
    }

    // Customer login check
    if (!showNameInput || targetEmail !== checkedEmail) {
      setIsSubmitting(true);
      try {
        const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(targetEmail)}`, {
          headers: {Accept: "application/json"}
        });
        if (checkRes.ok) {
          const checkData = (await checkRes.json()) as {exists: boolean; hasName: boolean};
          if (!checkData.hasName) {
            setShowNameInput(true);
            setCheckedEmail(targetEmail);
            setIsSubmitting(false);
            return;
          }
        }
      } catch {
        // Silently continue
      }
      setIsSubmitting(false);
    }

    if (showNameInput && !name.trim()) {
      setStatus("Please enter your name to continue.");
      return;
    }

    setIsSubmitting(true);
    const result = (await signIn("credentials", {
      email: targetEmail,
      name: showNameInput ? name.trim() : "",
      redirect: false,
      callbackUrl
    })) as {ok?: boolean; url?: string | null} | undefined;

    setIsSubmitting(false);

    if (!result?.ok) {
      setStatus("Unable to sign in with this email.");
      return;
    }

    window.location.href = callbackUrl;
  }

  const isNameRequired = showNameInput && email.trim().toLowerCase() === checkedEmail;

  return (
    <form onSubmit={submitLogin} className="mt-7 space-y-5">
      <label className="block">
        <span className="label-caps text-on-surface/75">Email Address</span>
        <input
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          maxLength={120}
          onChange={(event) => setEmail(cleanEmail(event.target.value))}
          className="mt-2 h-11 w-full border-0 border-b border-outline bg-surface-hi px-3 text-sm text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
        />
      </label>

      {isNameRequired ? (
        <label className="block">
          <span className="label-caps text-on-surface/75">Full Name</span>
          <input
            required
            type="text"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value.replace(/[<>{}[\]$;'"`|\\]/g, "").slice(0, 80))}
            className="mt-2 h-11 w-full border-0 border-b border-outline bg-surface-hi px-3 text-sm text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
          />
        </label>
      ) : null}

      {isAdminEmail ? (
        <label className="block">
          <span className="label-caps text-on-surface/75">Password</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            maxLength={80}
            onChange={(event) => setPassword(event.target.value.slice(0, 80))}
            className="mt-2 h-11 w-full border-0 border-b border-outline bg-surface-hi px-3 text-sm text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
          />
        </label>
      ) : null}

      {status ? (
        <p className="border border-outline bg-bg px-4 py-3 text-sm text-on-surface">
          {status}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !email || (isAdminEmail && !password) || (isNameRequired && !name)}
        className="label-caps flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing In..." : "Continue"}
      </button>
    </form>
  );
}
