export type RenderedNewsletterEmailTemplate = {
  kind: "newsletter";
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

export function renderNewsletterEmailTemplate(
  subject: string,
  body: string,
  imageUrl?: string | null
): RenderedNewsletterEmailTemplate {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br />"))
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:#4b463e;font-size:16px;line-height:1.7;">${paragraph}</p>`
    )
    .join("");
  const previewText = body.split(/\s*\n\s*/)[0]?.trim() || subject;
  const image = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(subject)}" style="display:block;width:100%;height:auto;margin:0 0 26px;border:0;" />`
    : "";

  return {
    kind: "newsletter",
    label: "Newsletter · Community",
    audience: "Newsletter subscribers",
    trigger: "When an admin dispatches news from Community",
    subject,
    previewText,
    text: `${subject}\n\n${body}`,
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#F9F6F0;font-family:Arial,sans-serif;color:#201B11;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <div style="max-width:640px;margin:0 auto;padding:42px 24px;">
      <p style="margin:0 0 18px;color:#7A6A4F;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Valentro Atelier</p>
      <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-weight:400;font-size:36px;line-height:1.15;color:#201B11;">${escapeHtml(subject)}</h1>
      ${image}
      ${paragraphs}
      <div style="margin-top:34px;border-top:1px solid #cdc5bb;padding-top:18px;color:#7A6A4F;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Valentro Inner Circle</div>
    </div>
  </body>
</html>`
  };
}
