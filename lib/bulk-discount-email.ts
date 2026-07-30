export type BulkDiscountEmailCoupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: {toString(): string} | string | number;
  minOrderAmount: {toString(): string} | string | number | null;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
};

export type BulkDiscountEmailRecipient = {
  id: string;
  name: string | null;
  email: string;
};

export type RenderedBulkDiscountEmailTemplate = {
  kind: "bulk-discount-awarded";
  label: string;
  audience: string;
  trigger: string;
  subject: string;
  previewText: string;
  text: string;
  html: string;
};

export type BulkDiscountDeliveryResult = {
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  configured: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function price(value: BulkDiscountEmailCoupon["value"]) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2
  }).format(Number(value));
}

function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-EG", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function discountLabel(coupon: BulkDiscountEmailCoupon) {
  return coupon.type === "PERCENTAGE"
    ? `${Number(coupon.value)}% off`
    : `${price(coupon.value)} off`;
}

export function renderBulkDiscountEmailTemplate({
  coupon,
  recipient
}: {
  coupon: BulkDiscountEmailCoupon;
  recipient: BulkDiscountEmailRecipient;
}): RenderedBulkDiscountEmailTemplate {
  const offer = discountLabel(coupon);
  const customerName = recipient.name?.trim() || "Valentro customer";
  const previewText = `A private ${offer} offer has been added to your Valentro account.`;
  const availability = [
    coupon.startsAt ? `Available from ${date(coupon.startsAt)}` : "Available now",
    coupon.expiresAt ? `through ${date(coupon.expiresAt)}` : "with no fixed end date"
  ].join(" ");
  const minimum = coupon.minOrderAmount
    ? `Valid on orders of ${price(coupon.minOrderAmount)} or more.`
    : "No minimum order value is required.";
  const shopUrl = `${siteUrl()}/en/fragrances`;
  const message = `Hello ${customerName},\n\nYou have been selected for a private Valentro offer. Your ${offer} discount is linked to ${recipient.email} and will be applied automatically when you use this email at checkout.\n\nOffer code: ${coupon.code}\n${availability}.\n${minimum}\n\nExplore fragrances: ${shopUrl}`;

  return {
    kind: "bulk-discount-awarded",
    label: "Bulk discount · Customer",
    audience: "Customers selected by the Bulk Engine",
    trigger: "When an admin creates a Bulk Engine discount",
    subject: `A private Valentro offer · ${offer}`,
    previewText,
    text: message,
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#F9F6F0;font-family:Arial,sans-serif;color:#201B11;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <div style="max-width:640px;margin:0 auto;padding:42px 24px;">
      <p style="margin:0 0 18px;color:#7A6A4F;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Valentro Atelier</p>
      <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:38px;line-height:1.15;color:#201B11;">A private offer, just for you</h1>
      <p style="margin:0 0 26px;color:#4B463E;font-size:16px;line-height:1.75;">Hello ${escapeHtml(customerName)}, you have been selected for a private Valentro offer.</p>
      <div style="margin:0 0 24px;border:1px solid #CDC5BB;background:#F2EAE0;padding:24px;">
        <p style="margin:0 0 8px;color:#7A6A4F;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;">Your account offer</p>
        <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:34px;line-height:1.15;color:#201B11;">${escapeHtml(offer)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;color:#4B463E;font-size:14px;line-height:1.7;">
          <tr><td style="padding:4px 0;color:#7A6A4F;">Offer code</td><td align="right" style="padding:4px 0;font-weight:700;letter-spacing:0.08em;color:#201B11;">${escapeHtml(coupon.code)}</td></tr>
          <tr><td style="padding:4px 0;color:#7A6A4F;">Availability</td><td align="right" style="padding:4px 0;color:#201B11;">${escapeHtml(availability)}</td></tr>
          <tr><td style="padding:4px 0;color:#7A6A4F;">Minimum order</td><td align="right" style="padding:4px 0;color:#201B11;">${coupon.minOrderAmount ? escapeHtml(price(coupon.minOrderAmount)) : "None"}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#4B463E;font-size:15px;line-height:1.75;">This offer is already linked to <strong>${escapeHtml(recipient.email)}</strong>. Use the same email at checkout and the discount will be considered automatically.</p>
      <a href="${escapeHtml(shopUrl)}" style="display:inline-block;margin-top:28px;border:1px solid #201B11;background:#201B11;color:#F9F6F0;padding:15px 24px;font-size:12px;letter-spacing:0.14em;text-decoration:none;text-transform:uppercase;">Explore fragrances</a>
      <div style="margin-top:36px;border-top:1px solid #CDC5BB;padding-top:18px;color:#7A6A4F;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Valentro Inner Circle</div>
    </div>
  </body>
</html>`
  };
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

export async function sendBulkDiscountEmails(
  coupon: BulkDiscountEmailCoupon & {users: BulkDiscountEmailRecipient[]}
): Promise<BulkDiscountDeliveryResult> {
  const recipients = coupon.users;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;

  if (recipients.length === 0) {
    return {recipients: 0, sent: 0, failed: 0, skipped: 0, configured: true};
  }

  if (!apiKey || !from) {
    console.warn("Bulk discount emails were not sent because email delivery is not configured");
    return {
      recipients: recipients.length,
      sent: 0,
      failed: recipients.length,
      skipped: 0,
      configured: false
    };
  }

  const sendable = recipients.filter(
    (recipient) =>
      !isBlockedTestAddress(recipient.email) &&
      (!isResendTestSender(from) || recipient.email.toLowerCase().endsWith("@resend.dev"))
  );
  const skipped = recipients.length - sendable.length;
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < sendable.length; index += 100) {
    const batch = sendable.slice(index, index + 100);

    try {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `bulk-discount-${coupon.id}-${index / 100}`
        },
        body: JSON.stringify(
          batch.map((recipient) => {
            const template = renderBulkDiscountEmailTemplate({coupon, recipient});

            return {
              from,
              to: [recipient.email],
              subject: template.subject,
              html: template.html,
              text: template.text
            };
          })
        ),
        signal: AbortSignal.timeout(10_000)
      });

      if (!response.ok) {
        const providerError = (await response.json().catch(() => null)) as
          | {message?: string}
          | null;
        console.error(
          "Bulk discount email batch was rejected:",
          providerError?.message ?? response.status
        );
        failed += batch.length;
        continue;
      }

      sent += batch.length;
    } catch (error) {
      console.error(
        "Bulk discount email batch failed:",
        error instanceof Error ? error.message : "Unknown delivery error"
      );
      failed += batch.length;
    }
  }

  if (skipped > 0) {
    console.warn(`Bulk discount emails skipped ${skipped} blocked or test-only recipient(s)`);
  }

  return {
    recipients: recipients.length,
    sent,
    failed,
    skipped,
    configured: true
  };
}
