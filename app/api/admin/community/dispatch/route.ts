import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {isAdminRequest} from "@/lib/admin-auth";
import {renderNewsletterEmailTemplate} from "@/lib/newsletter-email";
import {uploadNewsletterImage} from "@/lib/newsletter-images";
import {prisma} from "@/lib/prisma";

export const runtime = "nodejs";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({message: "Invalid newsletter request"}, {status: 400});
  }

  const subject = text(form.get("subject"));
  const body = text(form.get("body"));

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

  const image = form.get("image");
  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await uploadNewsletterImage(image);
    } catch (error) {
      return NextResponse.json(
        {message: error instanceof Error ? error.message : "Unable to upload newsletter image"},
        {status: 400}
      );
    }
  }

  const template = renderNewsletterEmailTemplate(subject, body, imageUrl);
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
          html: template.html,
          text: template.text
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
