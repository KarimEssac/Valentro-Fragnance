import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

type DispatchPayload = {
  subject?: unknown;
  body?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtml(subject: string, body: string) {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br />"))
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:#4b463e;font-size:16px;line-height:1.7;">${paragraph}</p>`
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#F9F6F0;font-family:Arial,sans-serif;color:#201B11;">
    <div style="max-width:640px;margin:0 auto;padding:42px 24px;">
      <p style="margin:0 0 18px;color:#7A6A4F;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Valentro Atelier</p>
      <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-weight:400;font-size:36px;line-height:1.15;color:#201B11;">${escapeHtml(subject)}</h1>
      ${paragraphs}
      <div style="margin-top:34px;border-top:1px solid #cdc5bb;padding-top:18px;color:#7A6A4F;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Valentro Inner Circle</div>
    </div>
  </body>
</html>`;
}

function isBlockedTestAddress(email: string) {
  const domain = email.split("@").pop()?.toLowerCase();

  return Boolean(
    domain &&
      [
        "example.com",
        "example.net",
        "example.org",
        "test.com",
        "test.net",
        "test.org"
      ].includes(domain)
  );
}

function isResendTestSender(from: string) {
  return from.toLowerCase().includes("@resend.dev");
}

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const payload = (await request.json()) as DispatchPayload;
  const subject = text(payload.subject);
  const body = text(payload.body);

  if (!subject || subject.length > 140) {
    return NextResponse.json(
      {message: "Subject is required and must be 140 characters or less."},
      {status: 400}
    );
  }

  if (!body || body.length > 5000) {
    return NextResponse.json(
      {message: "Message body is required and must be 5000 characters or less."},
      {status: 400}
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;

  if (!apiKey || !from) {
    return NextResponse.json(
      {
        message:
          "Email dispatch is not configured. Add RESEND_API_KEY and NEWSLETTER_FROM_EMAIL to the environment."
      },
      {status: 503}
    );
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: {createdAt: "desc"},
    select: {email: true}
  });

  const deliverableSubscribers = subscribers.filter(
    (subscriber) => !isBlockedTestAddress(subscriber.email)
  );
  const skippedCount = subscribers.length - deliverableSubscribers.length;

  if (
    isResendTestSender(from) &&
    deliverableSubscribers.some(
      (subscriber) => !subscriber.email.toLowerCase().endsWith("@resend.dev")
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Resend test sender can only email Resend test addresses. Subscribe with delivered@resend.dev, or verify a domain and use NEWSLETTER_FROM_EMAIL on that domain."
      },
      {status: 400}
    );
  }

  if (deliverableSubscribers.length === 0) {
    return NextResponse.json(
      {
        message:
          skippedCount > 0
            ? "Only blocked test addresses were found. Use delivered@resend.dev for testing."
            : "There are no newsletter subscribers to email."
      },
      {status: 400}
    );
  }

  const html = buildHtml(subject, body);
  const batches = [];

  for (let index = 0; index < deliverableSubscribers.length; index += 100) {
    batches.push(deliverableSubscribers.slice(index, index + 100));
  }

  for (const batch of batches) {
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        batch.map((subscriber) => ({
          from,
          to: [subscriber.email],
          subject,
          html
        }))
      )
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null) as
        | {message?: string}
        | null;
      console.error("Newsletter dispatch failed:", error);
      return NextResponse.json(
        {message: error?.message ?? "Email provider rejected the dispatch."},
        {status: 502}
      );
    }
  }

  return NextResponse.json({
    message: `Dispatch sent to ${deliverableSubscribers.length} subscriber${
      deliverableSubscribers.length === 1 ? "" : "s"
    }${skippedCount > 0 ? `; skipped ${skippedCount} blocked test address${skippedCount === 1 ? "" : "es"}.` : "."}`
  });
}
