"use client";

import {useEffect, useMemo, useState} from "react";
import type {ChangeEvent, FormEvent, ReactNode} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";

type Product = {
  id: string;
  nameEn: string;
  slug: string;
  image: string | null;
  price: string | null;
};

type CollectionOffer = {
  id: string;
  slug: string;
  code: string | null;
  nameEn: string;
  descriptionEn: string;
  coverImage: string;
  offerPrice: string | null;
  isPublished: boolean;
  position: number;
  products: Product[];
};

type Props = {
  locale: string;
  products: Product[];
  collections: CollectionOffer[];
};

type FormState = {
  nameEn: string;
  nameAr: string;
  slug: string;
  code: string;
  descriptionEn: string;
  descriptionAr: string;
  offerPrice: string;
  position: string;
  isPublished: boolean;
};

const emptyForm: FormState = {
  nameEn: "",
  nameAr: "",
  slug: "",
  code: "",
  descriptionEn: "",
  descriptionAr: "",
  offerPrice: "",
  position: "",
  isPublished: true
};

function inputClass() {
  return "w-full border-0 border-b border-[#7A6A4F] bg-transparent px-0 py-3 text-base text-[#201B11] outline-none placeholder:text-[#7c766d] focus:border-[#D4AF37] focus:ring-0";
}

function labelClass() {
  return "label-caps mb-2 block text-[#7A6A4F]";
}

function Field({label, children}: {label: string; children: ReactNode}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      {children}
    </label>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function AdminCollectionsClient({locale, products, collections}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  const selectedProducts = useMemo(
    () => selectedIds.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[],
    [products, selectedIds]
  );

  const filteredProducts = useMemo(() => {
    const normalized = productQuery.trim().toLowerCase();
    return products
      .filter((product) =>
        `${product.nameEn} ${product.slug}`.toLowerCase().includes(normalized)
      )
      .slice(0, 40);
  }, [products, productQuery]);

  const combinedValue = selectedProducts.reduce(
    (sum, product) => sum + Number(product.price ?? 0),
    0
  );
  const offerPrice = Number(form.offerPrice || 0);
  const discountPercent =
    combinedValue > 0 && offerPrice > 0
      ? Math.max(0, Math.round(((combinedValue - offerPrice) / combinedValue) * 100))
      : 0;
  const previewImage = uploadedPreview ?? selectedProducts[0]?.image;

  useEffect(() => {
    return () => {
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);
    };
  }, [uploadedPreview]);

  function updateForm(key: keyof FormState, value: FormState[typeof key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "nameEn" && !current.slug ? {slug: slugify(String(value))} : {})
    }));
  }

  function toggleProduct(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setUploadedPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const publishOverride = submitter?.dataset.publish;
      const payload = {
        ...form,
        isPublished:
          publishOverride === undefined ? form.isPublished : publishOverride === "true",
        productIds: selectedIds
      };
      const body = new FormData();
      body.set("payload", JSON.stringify(payload));
      if (imageFile) body.set("image", imageFile);

      const response = await fetch("/api/admin/collections", {
        method: "POST",
        body
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to create collection offer");

      setForm(emptyForm);
      setSelectedIds([]);
      setImageFile(null);
      setUploadedPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      router.refresh();
      setStatus(result.message ?? "Collection offer created");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create collection offer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="-mx-gutter -my-10 min-h-screen bg-[#fcf9f3] px-5 py-12 text-[#201B11] sm:-my-12 md:px-16 md:py-24 lg:-mx-16">
      <header className="mb-16 border-b border-[#7A6A4F] pb-8 md:mb-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="label-caps mb-4 text-[#7A6A4F]">Collection Offers</p>
            <h1 className="font-serif text-[clamp(2.25rem,6vw,5.25rem)] leading-[1.05] text-[#201B11]">
              Curate Offers
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#4b463e] lg:col-span-5">
            Build limited product bundles with a collection image, curated product set, and a
            discounted bundle price.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <form onSubmit={submitCreate} className="lg:col-span-8">
          <section className="border border-[#7A6A4F]/15 bg-[#EAE4D8]/25 p-6 md:p-10">
            <div className="mb-10 flex flex-col gap-4 border-b border-[#7A6A4F]/25 pb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="label-caps mb-3 text-[#7A6A4F]">Bundle Builder</p>
                <h2 className="font-serif text-[2rem] leading-tight">New Collection Bundle</h2>
              </div>
              <label className="label-caps flex items-center gap-3 text-[#4b463e]">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => updateForm("isPublished", event.target.checked)}
                />
                Publish after save
              </label>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Field label="Offer Title">
                <input
                  value={form.nameEn}
                  onChange={(event) => updateForm("nameEn", event.target.value)}
                  placeholder="e.g. Midnight Ritual"
                  className={inputClass()}
                />
              </Field>
              <Field label="Arabic Title">
                <input
                  value={form.nameAr}
                  onChange={(event) => updateForm("nameAr", event.target.value)}
                  placeholder="Optional"
                  className={inputClass()}
                />
              </Field>
              <Field label="Slug">
                <input
                  value={form.slug}
                  onChange={(event) => updateForm("slug", slugify(event.target.value))}
                  placeholder="midnight-ritual"
                  className={inputClass()}
                />
              </Field>
              <Field label="Internal Ref Code">
                <input
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value)}
                  placeholder="Auto from title if empty"
                  className={inputClass()}
                />
              </Field>
              <Field label="Bundle Price">
                <input
                  value={form.offerPrice}
                  type="number"
                  min="1"
                  step="0.01"
                  onChange={(event) => updateForm("offerPrice", event.target.value)}
                  placeholder="2400"
                  className={inputClass()}
                />
              </Field>
              <Field label="Display Order">
                <input
                  value={form.position}
                  type="number"
                  min="1"
                  onChange={(event) => updateForm("position", event.target.value)}
                  placeholder="Leave empty to place last"
                  className={inputClass()}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Collection Image">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="w-full border border-[#7A6A4F]/25 bg-white/35 p-4 text-sm text-[#4b463e] file:mr-4 file:border-0 file:bg-[#201B11] file:px-4 file:py-2 file:text-[#F9F6F0]"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Curator Note">
                  <textarea
                    value={form.descriptionEn}
                    onChange={(event) => updateForm("descriptionEn", event.target.value)}
                    rows={4}
                    placeholder="Describe the offer mood and intent."
                    className={`${inputClass()} resize-none`}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Arabic Curator Note">
                  <textarea
                    value={form.descriptionAr}
                    onChange={(event) => updateForm("descriptionAr", event.target.value)}
                    rows={3}
                    placeholder="Optional"
                    className={`${inputClass()} resize-none`}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-10 grid gap-4 border-y border-[#7A6A4F]/20 py-6 sm:grid-cols-3">
              <Metric label="Combined Value" value={money.format(combinedValue)} />
              <Metric label="Bundle Price" value={offerPrice ? money.format(offerPrice) : "-"} />
              <Metric label="Effective Discount" value={`${discountPercent}%`} />
            </div>

            <div className="mt-10">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="label-caps mb-2 text-[#7A6A4F]">Product Selection</p>
                  <h3 className="font-serif text-2xl">Add Product to Bundle</h3>
                </div>
                <input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Search fragrances"
                  className="w-full border-0 border-b border-[#7A6A4F] bg-transparent pb-3 text-sm uppercase tracking-[0.15em] outline-none placeholder:text-[#7c766d] focus:border-[#D4AF37] md:w-72"
                />
              </div>
              <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-2 md:grid-cols-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`grid grid-cols-[4rem_1fr_auto] items-center gap-4 border p-3 text-left transition-colors ${
                      selectedIds.includes(product.id)
                        ? "border-[#201B11] bg-white"
                        : "border-[#7A6A4F]/20 bg-white/35 hover:border-[#D4AF37]"
                    }`}
                  >
                    <ImageThumb src={product.image} alt={product.nameEn} />
                    <span>
                      <span className="block text-sm font-semibold text-[#201B11]">
                        {product.nameEn}
                      </span>
                      <span className="text-xs text-[#7c766d]">
                        {product.price ? money.format(Number(product.price)) : "No price"}
                      </span>
                    </span>
                    <span className="label-caps text-[#7A6A4F]">
                      {selectedIds.includes(product.id) ? "Added" : "Add"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {status ? <p className="mt-6 text-sm text-[#735c00]">{status}</p> : null}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                data-publish="false"
                className="label-caps min-h-14 border border-[#201B11] px-8 text-[#201B11] transition-colors hover:bg-[#EAE4D8]"
              >
                Save Draft
              </button>
              <button
                type="submit"
                data-publish="true"
                disabled={submitting}
                className="label-caps min-h-14 bg-[#201B11] px-8 text-[#F9F6F0] transition-colors hover:bg-[#D4AF37] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Publish Bundle"}
              </button>
            </div>
          </section>
        </form>

        <aside className="lg:col-span-4">
          <div className="sticky top-8 border border-[#7A6A4F]/20 bg-white/45 p-6">
            <p className="label-caps mb-4 text-[#7A6A4F]">Composition Canvas</p>
            <div className="relative mb-6 aspect-[4/5] overflow-hidden bg-[#EAE4D8]">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage}
                  alt="Collection preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm text-[#7c766d]">
                  Select products or upload a collection image.
                </div>
              )}
              {selectedProducts.slice(0, 3).map((product, index) =>
                product.image ? (
                  <div
                    key={product.id}
                    className="absolute h-24 w-20 overflow-hidden border border-white bg-[#f9f6f0] shadow-[0_18px_50px_rgba(32,27,17,0.12)]"
                    style={{
                      right: `${1 + index * 2.5}rem`,
                      bottom: `${1 + index * 1.75}rem`,
                      transform: `rotate(${index % 2 === 0 ? -4 : 4}deg)`
                    }}
                  >
                    <Image src={product.image} alt={product.nameEn} fill className="object-cover" />
                  </div>
                ) : null
              )}
            </div>
            <div className="space-y-3">
              {selectedProducts.length ? (
                selectedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 border-b border-[#7A6A4F]/15 pb-3 text-sm"
                  >
                    <span>
                      <span className="label-caps mr-3 text-[#7A6A4F]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {product.nameEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className="label-caps text-[#7A6A4F] hover:text-[#201B11]"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#7c766d]">No products selected yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <hr className="my-20 border-[#7A6A4F] opacity-40 md:my-28" />

      <section>
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-caps mb-3 text-[#7A6A4F]">Live Archive</p>
            <h2 className="font-serif text-[2rem] leading-tight">Active Offerings</h2>
          </div>
          <span className="label-caps text-[#7A6A4F]">{collections.length} offers</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {collections.map((collection) => {
            const total = collection.products.reduce(
              (sum, product) => sum + Number(product.price ?? 0),
              0
            );
            const price = Number(collection.offerPrice ?? 0);
            const discount =
              total > 0 && price > 0 ? Math.max(0, Math.round(((total - price) / total) * 100)) : 0;

            return (
              <article key={collection.id} className="border border-[#7A6A4F]/15 bg-white/40">
                <div className="relative aspect-[4/3] bg-[#EAE4D8]">
                  <Image
                    src={collection.coverImage}
                    alt={collection.nameEn}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="label-caps text-[#7A6A4F]">
                      {collection.code ?? collection.slug}
                    </span>
                    <span className="label-caps text-[#735c00]">
                      {collection.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl leading-tight">{collection.nameEn}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4b463e]">
                    {collection.descriptionEn || "No curator note."}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#7A6A4F]/15 pt-4 text-sm">
                    <Metric label="Items" value={collection.products.length.toString()} compact />
                    <Metric label="Price" value={price ? money.format(price) : "-"} compact />
                    <Metric label="Off" value={`${discount}%`} compact />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {collections.length === 0 ? (
          <p className="border border-[#7A6A4F]/15 bg-white/35 p-8 text-center text-sm text-[#7c766d]">
            No collection offers have been created yet.
          </p>
        ) : null}
      </section>
    </section>
  );
}

function Metric({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="label-caps mb-1 text-[#7A6A4F]">{label}</p>
      <p className={`${compact ? "text-base" : "text-2xl"} font-semibold text-[#201B11]`}>
        {value}
      </p>
    </div>
  );
}

function ImageThumb({src, alt}: {src: string | null; alt: string}) {
  return (
    <span className="relative block h-16 w-16 overflow-hidden bg-[#EAE4D8]">
      {src ? <Image src={src} alt={alt} fill className="object-cover" /> : null}
    </span>
  );
}
