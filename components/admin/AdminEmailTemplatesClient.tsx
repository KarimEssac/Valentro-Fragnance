"use client";

import {useState} from "react";

import ValentroSelect from "@/components/ui/ValentroSelect";
import type {RenderedBulkDiscountEmailTemplate} from "@/lib/bulk-discount-email";
import type {OrderEmailTemplateKind, RenderedOrderEmailTemplate} from "@/lib/order-email";
import type {RenderedNewsletterEmailTemplate} from "@/lib/newsletter-email";
import type {
  RenderedRestockDemandOwnerEmailTemplate,
  RenderedRestockEmailTemplate
} from "@/lib/restock-email";

type EmailTemplateKind =
  | OrderEmailTemplateKind
  | "bulk-discount-awarded"
  | "newsletter"
  | "restock-available"
  | "restock-request-owner";
type EmailTemplatePreview =
  | RenderedOrderEmailTemplate
  | RenderedBulkDiscountEmailTemplate
  | RenderedNewsletterEmailTemplate
  | RenderedRestockEmailTemplate
  | RenderedRestockDemandOwnerEmailTemplate;

type AdminEmailTemplatesClientProps = {
  locale: string;
  templates: EmailTemplatePreview[];
};

const kindOrder: EmailTemplateKind[] = [
  "admin-order-placed",
  "customer-order-placed",
  "customer-order-shipped",
  "bulk-discount-awarded",
  "newsletter",
  "restock-available",
  "restock-request-owner"
];

export default function AdminEmailTemplatesClient({
  locale,
  templates
}: AdminEmailTemplatesClientProps) {
  const [selectedKind, setSelectedKind] = useState<EmailTemplateKind>(
    kindOrder[0]
  );
  const selected =
    templates.find((template) => template.kind === selectedKind) ?? templates[0];

  if (!selected) return null;

  return (
    <section className="min-h-screen bg-surface-hi px-gutter py-8 text-parchment sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1500px]">
        <header className="border-b border-outline/70 pb-8">
          <p className="label-caps text-gold">Transactional Email Studio</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                Email templates
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface/70">
                Preview every customer, owner, order, and newsletter message. They
                share the Valentro Atelier style and are ready for Resend.
              </p>
            </div>
            <span className="label-caps text-on-surface/60">{templates.length} templates</span>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden space-y-3 lg:block">
            <p className="label-caps mb-4 text-on-surface/65">Choose a message</p>
            {templates.map((template) => {
              const isActive = template.kind === selected.kind;

              return (
                <button
                  key={template.kind}
                  type="button"
                  onClick={() => setSelectedKind(template.kind)}
                  className={`w-full border p-4 text-left transition-colors ${
                    isActive
                      ? "border-gold bg-gold text-surface-hi"
                      : "border-outline/60 bg-surface/60 text-parchment hover:border-gold/70"
                  }`}
                >
                  <span className={`label-caps text-[10px] ${isActive ? "text-surface-hi/80" : "text-gold"}`}>
                    {template.audience}
                  </span>
                  <span className="mt-2 block font-serif text-xl leading-tight">
                    {template.label}
                  </span>
                  <span className={`mt-3 block text-xs leading-5 ${isActive ? "text-surface-hi/80" : "text-on-surface/65"}`}>
                    {template.trigger}
                  </span>
                </button>
              );
            })}

            <div className="mt-6 border border-outline/60 bg-surface/60 p-4 text-sm leading-6 text-on-surface/70">
              <p className="label-caps mb-2 text-gold">Preview data</p>
              {selected.kind === "newsletter" ? (
                <>
                  <p>The Autumn Collection Reveal</p>
                  <p>One attached image</p>
                </>
              ) : selected.kind === "restock-available" ? (
                <>
                  <p>Emporio Armani 50ml</p>
                  <p>Available again</p>
                </>
              ) : selected.kind === "restock-request-owner" ? (
                <>
                  <p>layla.customer@example.com</p>
                  <p>Emporio Armani 50ml</p>
                </>
              ) : selected.kind === "bulk-discount-awarded" ? (
                <>
                  <p>Layla Hassan · 15% off</p>
                  <p>BULK-VIP15 · EGP 1,200 minimum</p>
                </>
              ) : (
                <>
                  <p>Order #VAL-6ORDER</p>
                  <p>Layla Hassan · 2 selections</p>
                  <p>EGP 2,450 total</p>
                </>
              )}
              <p className="mt-3 text-xs text-on-surface/55">
                This screen uses sample content only. Live order emails use
                database details; newsletter and restock previews use their live
                email renderers.
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            <label className="mb-5 block lg:hidden">
              <span className="label-caps mb-2 block text-[10px] text-on-surface/65">
                Choose a message
              </span>
              <ValentroSelect
                value={selected.kind}
                onChange={(event) => setSelectedKind(event.target.value as EmailTemplateKind)}
                className="min-h-12"
              >
                {templates.map((template) => (
                  <option key={template.kind} value={template.kind}>
                    {template.label}
                  </option>
                ))}
              </ValentroSelect>
            </label>

            <div className="mb-5 grid gap-4 border border-outline/60 bg-surface/60 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <p className="label-caps text-[10px] text-on-surface/60">Subject</p>
                <p className="mt-2 break-words text-sm text-parchment">{selected.subject}</p>
              </div>
              <div>
                <p className="label-caps text-[10px] text-on-surface/60">Recipient</p>
                <p className="mt-2 text-sm text-parchment">{selected.audience}</p>
              </div>
              <div>
                <p className="label-caps text-[10px] text-on-surface/60">Trigger</p>
                <p className="mt-2 text-sm text-parchment">{selected.trigger}</p>
              </div>
            </div>

            <div className="border border-outline/60 bg-[#ded4c7] p-3 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="label-caps text-[10px] text-umber">Rendered email preview</p>
                <span className="text-xs text-umber/70">{locale.toUpperCase()} locale shell</span>
              </div>
              <iframe
                key={selected.kind}
                title={`${selected.label} preview`}
                srcDoc={selected.html}
                sandbox=""
                className="h-[820px] w-full border border-[#c9bdaf] bg-[#f9f6f0]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
