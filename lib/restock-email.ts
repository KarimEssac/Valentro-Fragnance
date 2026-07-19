export type RestockEmailRequest = {
  locale: string;
  variant: {
    sizeML: number;
    fragrance: {
      slug: string;
      nameEn: string;
      nameAr: string;
      imageUrl?: string | null;
    };
  };
};

export type RestockDemandOwnerEmailRequest = {
  requestId: string;
  requesterEmail: string;
  requestedAt: Date | string;
  variant: RestockEmailRequest["variant"];
};

export type RenderedRestockEmailTemplate = {
  kind: "restock-available";
  label: string;
  audience: string;
  trigger: string;
  subject: string;
  previewText: string;
  text: string;
  html: string;
};

export type RenderedRestockDemandOwnerEmailTemplate = {
  kind: "restock-request-owner";
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

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function renderRestockEmailTemplate(
  request: RestockEmailRequest
): RenderedRestockEmailTemplate {
  const isArabic = request.locale === "ar";
  const fragranceName = isArabic
    ? request.variant.fragrance.nameAr
    : request.variant.fragrance.nameEn;
  const productUrl = `${siteUrl()}/${isArabic ? "ar" : "en"}/fragrances/${encodeURIComponent(
    request.variant.fragrance.slug
  )}`;
  const subject = isArabic
    ? `Ø¹Ø§Ø¯ ${fragranceName} Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø®Ø²ÙˆÙ†`
    : `Back in stock: ${fragranceName}`;
  const preview = isArabic
    ? `${fragranceName} Ø¨Ø­Ø¬Ù… ${request.variant.sizeML} Ù…Ù„ Ù…ØªØ§Ø­ Ø§Ù„Ø¢Ù†.`
    : `${fragranceName} ${request.variant.sizeML}ml is available again.`;
  const heading = isArabic ? "Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù†ØªÙ‡Ù‰" : "The wait is over";
  const message = isArabic
    ? `Ø§Ù„Ø¹Ø·Ø± Ø§Ù„Ø°ÙŠ Ø·Ù„Ø¨Øª Ù…Ø¹Ø±ÙØ© Ù…ÙˆØ¹Ø¯ Ø¹ÙˆØ¯ØªÙ‡ØŒ ${fragranceName} Ø¨Ø­Ø¬Ù… ${request.variant.sizeML} Ù…Ù„ØŒ Ù…ØªØ§Ø­ Ø§Ù„Ø¢Ù†. Ø§Ù„ÙƒÙ…ÙŠØ© Ù‚Ø¯ ØªÙƒÙˆÙ† Ù…Ø­Ø¯ÙˆØ¯Ø©.`
    : `${fragranceName} ${request.variant.sizeML}ml, the fragrance you asked us to watch, is available again. Quantities may be limited.`;
  const button = isArabic ? "ØªØ³ÙˆÙ‚ Ø§Ù„Ø¹Ø·Ø±" : "Shop the fragrance";
  const direction = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";
  const image = request.variant.fragrance.imageUrl
    ? `<img src="${escapeHtml(request.variant.fragrance.imageUrl)}" alt="${escapeHtml(fragranceName)}" style="display:block;width:100%;max-width:520px;height:auto;margin:0 auto 26px;border:0;" />`
    : "";

  return {
    kind: "restock-available",
    label: "Back in stock · Customer",
    audience: "Restock requester",
    trigger: "When an admin increases an item’s stock",
    subject,
    previewText: preview,
    text: `${preview}\n\n${productUrl}`,
    html: `<!doctype html>
<html dir="${direction}">
  <body style="margin:0;background:#F9F6F0;font-family:Arial,sans-serif;color:#201B11;text-align:${align};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
    <div style="max-width:640px;margin:0 auto;padding:42px 24px;">
      <p style="margin:0 0 18px;color:#7A6A4F;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Valentro Atelier</p>
      <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-weight:400;font-size:38px;line-height:1.15;color:#201B11;">${escapeHtml(heading)}</h1>
      ${image}
      <p style="margin:0 0 28px;color:#4B463E;font-size:16px;line-height:1.75;">${escapeHtml(message)}</p>
      <a href="${escapeHtml(productUrl)}" style="display:inline-block;border:1px solid #201B11;background:#201B11;color:#F9F6F0;padding:15px 24px;font-size:12px;letter-spacing:0.14em;text-decoration:none;text-transform:uppercase;">${escapeHtml(button)}</a>
      <div style="margin-top:36px;border-top:1px solid #CDC5BB;padding-top:18px;color:#7A6A4F;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Valentro Atelier</div>
    </div>
  </body>
</html>`
  };
}

export function renderRestockDemandOwnerEmailTemplate(
  request: RestockDemandOwnerEmailRequest
): RenderedRestockDemandOwnerEmailTemplate {
  const fragranceName = request.variant.fragrance.nameEn;
  const sizeLabel = `${fragranceName} ${request.variant.sizeML}ml`;
  const previewText = `${request.requesterEmail} is waiting for ${sizeLabel}.`;
  const productUrl = `${siteUrl()}/en/fragrances/${encodeURIComponent(
    request.variant.fragrance.slug
  )}`;
  const inventoryUrl = `${siteUrl()}/en/admin/inventory`;
  const image = request.variant.fragrance.imageUrl
    ? `<img src="${escapeHtml(request.variant.fragrance.imageUrl)}" alt="${escapeHtml(fragranceName)}" style="display:block;width:100%;max-width:520px;height:auto;margin:0 auto 26px;border:0;" />`
    : "";
  const content = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 4px;background:#F2EAE0;">
    <tr><td style="padding:16px 18px;color:#4B463E;font-size:14px;line-height:1.7;">
      <span style="display:block;margin-bottom:5px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">Requester</span>
      <strong style="color:#201B11;">${escapeHtml(request.requesterEmail)}</strong>
    </td></tr>
    <tr><td style="padding:0 18px 16px;color:#4B463E;font-size:14px;line-height:1.7;">
      <span style="display:block;margin-bottom:5px;color:#7A6A4F;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;">Requested item</span>
      <strong style="color:#201B11;">${escapeHtml(sizeLabel)}</strong>
    </td></tr>
  </table>`;

  return {
    kind: "restock-request-owner",
    label: "Restock request · Owner",
    audience: "Owner / Admin",
    trigger: "When a customer requests an out-of-stock item",
    subject: `Restock request · ${sizeLabel}`,
    previewText,
    text: `${previewText}\n\nProduct: ${productUrl}\nInventory: ${inventoryUrl}`,
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#F9F6F0;font-family:Arial,sans-serif;color:#201B11;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <div style="max-width:640px;margin:0 auto;padding:42px 24px;">
      <p style="margin:0 0 18px;color:#7A6A4F;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Valentro Atelier</p>
      <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:38px;line-height:1.15;color:#201B11;">A customer is waiting</h1>
      <p style="margin:0 0 26px;color:#4B463E;font-size:16px;line-height:1.75;">A customer asked to be notified when an out-of-stock selection becomes available.</p>
      ${image}
      ${content}
      <a href="${escapeHtml(inventoryUrl)}" style="display:inline-block;margin-top:28px;border:1px solid #201B11;background:#201B11;color:#F9F6F0;padding:15px 24px;font-size:12px;letter-spacing:0.14em;text-decoration:none;text-transform:uppercase;">Open inventory</a>
      <div style="margin-top:36px;border-top:1px solid #CDC5BB;padding-top:18px;color:#7A6A4F;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Valentro Atelier</div>
    </div>
  </body>
</html>`
  };
}
