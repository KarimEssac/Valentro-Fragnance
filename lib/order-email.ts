import {prisma} from "@/lib/prisma";

export const orderEmailTemplateKinds = [
  "admin-order-placed",
  "customer-order-placed",
  "customer-order-shipped"
] as const;

export type OrderEmailTemplateKind = (typeof orderEmailTemplateKinds)[number];

type OrderEmailItem = {
  fragranceNameEn: string;
  sizeML: number;
  quantity: number;
  unitPrice: {toString(): string} | string | number;
  totalPrice: {toString(): string} | string | number;
};

type OrderEmailAddress = {
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string | null;
  city?: string;
  governorate?: string;
  postalCode?: string | null;
  phone?: string;
  country?: string;
};

export type OrderEmailOrder = {
  id: string;
  status: string;
  paymentMethod: string;
  subtotal: {toString(): string} | string | number;
  discountAmount: {toString(): string} | string | number;
  total: {toString(): string} | string | number;
  addressSnapshot: unknown;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string;
  };
  items: OrderEmailItem[];
};

export type RenderedOrderEmailTemplate = {
  kind: OrderEmailTemplateKind;
  label: string;
  audience: string;
  trigger: string;
  subject: string;
  previewText: string;
  text: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function asText(value: unknown) {
  return value == null ? "" : String(value);
}

function price(value: unknown) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-EG", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function orderNumber(order: Pick<OrderEmailOrder, "id">) {
  return `#VAL-${order.id.slice(-6).toUpperCase()}`;
}

function addressFromSnapshot(value: unknown): OrderEmailAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as OrderEmailAddress;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function orderUrl(order: Pick<OrderEmailOrder, "id">) {
  return `${siteUrl()}/en/orders/${encodeURIComponent(order.id)}`;
}

function emailShell({
  previewText,
  heading,
  message,
  content,
  cta
}: {
  previewText: string;
  heading: string;
  message: string;
  content: string;
  cta?: {label: string; href: string};
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#F9F6F0;font-family:Arial,sans-serif;color:#201B11;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <div style="max-width:640px;margin:0 auto;padding:42px 24px;">
      <p style="margin:0 0 18px;color:#7A6A4F;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Valentro Atelier</p>
      <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:38px;line-height:1.15;color:#201B11;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 26px;color:#4B463E;font-size:16px;line-height:1.75;">${escapeHtml(message)}</p>
      ${content}
      ${cta ? `<a href="${escapeHtml(cta.href)}" style="display:inline-block;margin-top:28px;border:1px solid #201B11;background:#201B11;color:#F9F6F0;padding:15px 24px;font-size:12px;letter-spacing:0.14em;text-decoration:none;text-transform:uppercase;">${escapeHtml(cta.label)}</a>` : ""}
      <div style="margin-top:36px;border-top:1px solid #CDC5BB;padding-top:18px;color:#7A6A4F;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Valentro Inner Circle</div>
    </div>
  </body>
</html>`;
}

function orderItemsHtml(order: OrderEmailOrder) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:13px 0;border-bottom:1px solid #E1D9CF;color:#201B11;font-size:14px;line-height:1.45;">
          <strong>${escapeHtml(item.fragranceNameEn)}</strong><br />
          <span style="color:#7A6A4F;font-size:12px;">${item.sizeML}ml &times; ${item.quantity}</span>
        </td>
        <td align="right" style="padding:13px 0;border-bottom:1px solid #E1D9CF;color:#201B11;font-size:14px;white-space:nowrap;">${escapeHtml(price(item.totalPrice))}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px;">
    <thead>
      <tr>
        <th align="left" style="padding:0 0 9px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:400;">Selection</th>
        <th align="right" style="padding:0 0 9px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:400;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function orderSummaryHtml(order: OrderEmailOrder) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;color:#4B463E;font-size:14px;line-height:1.7;">
    <tr><td style="padding:3px 0;">Subtotal</td><td align="right" style="padding:3px 0;">${escapeHtml(price(order.subtotal))}</td></tr>
    <tr><td style="padding:3px 0;">Discount</td><td align="right" style="padding:3px 0;">${escapeHtml(price(order.discountAmount))}</td></tr>
    <tr><td style="padding:12px 0 0;border-top:1px solid #CDC5BB;color:#201B11;font-family:Georgia,serif;font-size:22px;">Total</td><td align="right" style="padding:12px 0 0;border-top:1px solid #CDC5BB;color:#201B11;font-family:Georgia,serif;font-size:22px;">${escapeHtml(price(order.total))}</td></tr>
  </table>`;
}

function orderMetaHtml(order: OrderEmailOrder) {
  const address = addressFromSnapshot(order.addressSnapshot);
  const recipient = [address.firstName, address.lastName].filter(Boolean).join(" ") || order.user.name || order.user.email;
  const deliveryAddress = [
    address.address,
    address.apartment,
    [address.city, address.governorate, address.postalCode].filter(Boolean).join(", "),
    address.country ?? "Egypt"
  ]
    .filter(Boolean)
    .map((part) => escapeHtml(asText(part)))
    .join("<br />");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0 26px;background:#F2EAE0;">
    <tr>
      <td style="padding:16px 18px;border-right:1px solid #D8CEC1;vertical-align:top;">
        <span style="display:block;margin-bottom:5px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">Order</span>
        <strong style="color:#201B11;font-size:15px;">${escapeHtml(orderNumber(order))}</strong>
      </td>
      <td style="padding:16px 18px;vertical-align:top;">
        <span style="display:block;margin-bottom:5px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">Placed</span>
        <strong style="color:#201B11;font-size:15px;">${escapeHtml(date(order.createdAt))}</strong>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding:0 18px 16px;color:#4B463E;font-size:13px;line-height:1.65;">
        <span style="display:block;margin-bottom:5px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">Delivery to</span>
        ${escapeHtml(recipient)}<br />${deliveryAddress}
      </td>
    </tr>
  </table>`;
}

function statusPill(label: string) {
  return `<span style="display:inline-block;border:1px solid #A97832;color:#6F4618;padding:8px 12px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(label)}</span>`;
}

export function renderOrderEmailTemplate(
  kind: OrderEmailTemplateKind,
  order: OrderEmailOrder
): RenderedOrderEmailTemplate {
  const number = orderNumber(order);
  const customerName = order.user.name || "there";
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const itemLabel = `${itemCount} ${itemCount === 1 ? "selection" : "selections"}`;
  const meta = orderMetaHtml(order);
  const items = orderItemsHtml(order);
  const summary = orderSummaryHtml(order);
  const url = orderUrl(order);

  if (kind === "admin-order-placed") {
    const previewText = `${customerName} placed ${itemLabel} in order ${number}.`;
    const message = `${customerName} has placed a new order through the Valentro Atelier.`;
    const content = `${statusPill("New order")}${meta}${items}${summary}`;

    return {
      kind,
      label: "New order · Admin",
      audience: "Admin notification",
      trigger: "When a customer places an order",
      subject: `New order received · ${number}`,
      previewText,
      text: `${previewText}\n\n${message}\n\n${number}\n${date(order.createdAt)}\n\n${order.items.map((item) => `${item.fragranceNameEn} ${item.sizeML}ml x ${item.quantity} — ${price(item.totalPrice)}`).join("\n")}\n\nTotal: ${price(order.total)}`,
      html: emailShell({
        previewText,
        heading: "A new order has arrived",
        message,
        content
      })
    };
  }

  if (kind === "customer-order-shipped") {
    const previewText = `Order ${number} is on the way to you.`;
    const message = `Your Valentro selection is now on its way. We’ll keep you informed as it continues its journey.`;
    const content = `${statusPill("On the way")}${meta}${items}${summary}`;

    return {
      kind,
      label: "Shipping update · Customer",
      audience: "Customer who owns the order",
      trigger: "When an admin moves the order to Shipping",
      subject: `Your Valentro order is on the way · ${number}`,
      previewText,
      text: `${previewText}\n\nHi ${customerName},\n\n${message}\n\nTrack your order: ${url}`,
      html: emailShell({
        previewText,
        heading: "Your order is on the way",
        message,
        content,
        cta: {label: "Track your order", href: url}
      })
    };
  }

  const previewText = `We’ve received your order ${number}.`;
  const message = `Thank you, ${customerName}. We’ve received your order and will begin preparing your selection shortly.`;
  const content = `${statusPill("Order received")}${meta}${items}${summary}`;

  return {
    kind,
    label: "Order confirmation · Customer",
    audience: "Customer who placed the order",
    trigger: "When a customer places an order",
    subject: `Your Valentro order is confirmed · ${number}`,
    previewText,
    text: `${previewText}\n\n${message}\n\nTrack your order: ${url}`,
    html: emailShell({
      previewText,
      heading: "Thank you for your order",
      message,
      content,
      cta: {label: "View your order", href: url}
    })
  };
}

type EmailDeliveryResult = {
  sent: boolean;
  reason?: string;
};

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

async function deliverEmail({
  to,
  template,
  idempotencyKey
}: {
  to: string;
  template: RenderedOrderEmailTemplate;
  idempotencyKey: string;
}): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;

  if (!apiKey || !from) {
    return {sent: false, reason: "Email delivery is not configured"};
  }

  if (isBlockedTestAddress(to)) {
    return {sent: false, reason: `Skipped blocked test address ${to}`};
  }

  if (isResendTestSender(from) && !to.toLowerCase().endsWith("@resend.dev")) {
    return {sent: false, reason: "Resend test sender only permits @resend.dev recipients"};
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      const providerError = (await response.json().catch(() => null)) as
        | {message?: string}
        | null;
      return {
        sent: false,
        reason: providerError?.message ?? `Provider returned ${response.status}`
      };
    }

    return {sent: true};
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown delivery error"
    };
  }
}

async function findOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: {id: orderId},
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      items: {
        orderBy: {id: "asc"},
        select: {
          fragranceNameEn: true,
          sizeML: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true
        }
      }
    }
  });
}

function logDelivery(kind: string, recipient: string, result: EmailDeliveryResult) {
  if (!result.sent) {
    console.warn(`Order email ${kind} was not sent to ${recipient}: ${result.reason}`);
  }
}

export async function sendOrderPlacedEmails(orderId: string) {
  const order = await findOrderForEmail(orderId);

  if (!order) {
    console.warn(`Order email skipped because order ${orderId} was not found`);
    return;
  }

  const adminEmail = (
    process.env.ORDER_NOTIFICATION_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""
  ).trim().toLowerCase();
  const customerTemplate = renderOrderEmailTemplate("customer-order-placed", order);
  const adminTemplate = renderOrderEmailTemplate("admin-order-placed", order);

  if (adminEmail) {
    const result = await deliverEmail({
      to: adminEmail,
      template: adminTemplate,
      idempotencyKey: `order-placed-admin-${order.id}`
    });
    logDelivery("admin order placed", adminEmail, result);
  } else {
    console.warn("Order email admin notification skipped because no admin email is configured");
  }

  const customerResult = await deliverEmail({
    to: order.user.email,
    template: customerTemplate,
    idempotencyKey: `order-placed-customer-${order.id}`
  });
  logDelivery("customer order placed", order.user.email, customerResult);
}

export async function sendOrderShippedEmail(orderId: string) {
  const order = await findOrderForEmail(orderId);

  if (!order) {
    console.warn(`Shipping email skipped because order ${orderId} was not found`);
    return;
  }

  const template = renderOrderEmailTemplate("customer-order-shipped", order);
  const result = await deliverEmail({
    to: order.user.email,
    template,
    idempotencyKey: `order-shipped-customer-${order.id}`
  });
  logDelivery("customer order shipped", order.user.email, result);
}
