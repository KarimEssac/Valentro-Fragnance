"use client";

import Image from "next/image";
import {useRouter} from "next/navigation";
import {useEffect, useMemo, useState} from "react";

import Modal from "@/components/ui/Modal";
import ValentroSelect from "@/components/ui/ValentroSelect";
import {
  avoidanceVerbs,
  encodeFinderRule,
  finderRuleLabel,
  parseFinderRule,
  type FinderRuleVerb
} from "@/lib/finder-rules";
import {
  defaultIngredientCategories,
  ingredientCategoryFor
} from "@/lib/ingredient-categories";

export type InventoryProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  gender: string;
  scentProfile: string;
  sillage: string;
  longevity: number;
  isPublished: boolean;
  isFeatured: boolean;
  discountType: "PERCENTAGE" | "FIXED" | null;
  discountValue: string | null;
  discountIsActive: boolean;
  discountStartsAt: string | null;
  discountExpiresAt: string | null;
  position: number;
  totalStock: number;
  minPrice: string | null;
  maxPrice: string | null;
  primaryImage: {url: string; altEn: string; altAr: string} | null;
  images: {
    id: string;
    url: string;
    altEn: string;
    altAr: string;
    position: number;
    isPrimary: boolean;
  }[];
  collections: string[];
  variants: {id: string; sku: string; sizeML: number; price: string; stock: number}[];
  ingredients: {nameEn: string; note: string; category: string}[];
  avoidIf: string[];
  seasons: string[];
};

type Props = {
  locale: string;
  products: InventoryProduct[];
};

const genders = ["HIM", "HER", "UNISEX"];
const scents = ["VANILLA", "MUSK", "OUD", "FLORAL", "WOODY", "CITRUS", "AQUATIC", "SPICY", "POWDERY", "GOURMAND"];
const sillages = ["SOFT_LANDING", "MODERATE", "NOTICEABLE", "STRONG", "ENORMOUS", "FILLS_THE_ROOM"];
const seasons = ["SPRING", "SUMMER", "FALL", "WINTER", "ALL_YEAR"];

type VariantDraft = {
  id?: string;
  sizeML: string;
  price: string;
  stock: string;
};

type ImageDraft = {
  id: string;
  url: string;
  altEn: string;
  altAr: string;
  position: string;
  isPrimary: boolean;
  delete: boolean;
};

type IngredientEntry = {
  name: string;
  category: string;
};

function formatEnum(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function uniqueTerms(values: string[]) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter((value) => {
      const key = value.toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

function inputClass() {
  return "w-full border-0 border-b border-outline bg-transparent px-0 py-2 text-sm text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold focus:ring-0";
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <label className="block">
      <span className="label-caps mb-2 block text-gold">{label}</span>
      {children}
    </label>
  );
}

type DiscountStatusKey = "active" | "scheduled" | "expired" | "stopped" | "none";

const discountStatusStyles: Record<DiscountStatusKey, string> = {
  active: "border-emerald-500/45 bg-emerald-950/35 text-emerald-300",
  scheduled: "border-sky-500/45 bg-sky-950/35 text-sky-300",
  expired: "border-amber-500/45 bg-amber-950/35 text-amber-300",
  stopped: "border-outline bg-surface-mid text-on-surface/65",
  none: "border-outline/55 bg-surface/50 text-on-surface/50"
};

function discountStatus(product: InventoryProduct, now: number) {
  if (!product.discountType || !product.discountValue) {
    return {key: "none" as const, label: "No discount"};
  }
  if (!product.discountIsActive) {
    return {key: "stopped" as const, label: "Stopped"};
  }

  const startsAt = product.discountStartsAt
    ? new Date(product.discountStartsAt).getTime()
    : null;
  const expiresAt = product.discountExpiresAt
    ? new Date(product.discountExpiresAt).getTime()
    : null;

  if (startsAt !== null && startsAt > now) {
    return {key: "scheduled" as const, label: "Scheduled"};
  }
  if (expiresAt !== null && expiresAt <= now) {
    return {key: "expired" as const, label: "Expired"};
  }

  return {key: "active" as const, label: "Active"};
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function localDateTimeToIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function AdminInventoryClient({locale, products}: Props) {
  const router = useRouter();
  const isArabic = locale === "ar";
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState<InventoryProduct | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [discountProduct, setDiscountProduct] = useState<InventoryProduct | null>(null);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [discountStartsAt, setDiscountStartsAt] = useState("");
  const [discountExpiresAt, setDiscountExpiresAt] = useState("");
  const [discountSubmitting, setDiscountSubmitting] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [discountActionError, setDiscountActionError] = useState("");
  const [stoppingDiscountId, setStoppingDiscountId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientEntry[]>([]);
  const [selectedAvoidIf, setSelectedAvoidIf] = useState<string[]>([]);
  const [createVariants, setCreateVariants] = useState<VariantDraft[]>([
    {sizeML: "50", price: "", stock: "0"}
  ]);
  const currency = useMemo(() => new Intl.NumberFormat(locale, {style: "currency", currency: "EGP", maximumFractionDigits: 0}), [locale]);
  const dateTime = useMemo(
    () => new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}),
    [locale]
  );

  useEffect(() => {
    const syncCurrentTime = () => setCurrentTime(Date.now());
    const interval = window.setInterval(syncCurrentTime, 30_000);

    window.addEventListener("focus", syncCurrentTime);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncCurrentTime);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.slug, product.nameEn, product.nameAr, product.gender, product.scentProfile, ...product.collections, ...product.variants.map((variant) => variant.sku)]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [products, query]);

  const ingredientSuggestions = useMemo(() => {
    const byName = new Map<string, IngredientEntry>();

    products.forEach((product) => {
      product.ingredients.forEach((ingredient) => {
        const name = ingredient.nameEn.trim().replace(/\s+/g, " ");
        const key = name.toLocaleLowerCase();
        if (!name || byName.has(key)) return;
        byName.set(key, {
          name,
          category: ingredientCategoryFor(name, ingredient.category)
        });
      });
    });

    return [...byName.values()].sort((first, second) =>
      first.name.localeCompare(second.name)
    );
  }, [products]);
  const ingredientCategories = useMemo(
    () =>
      uniqueTerms([
        ...defaultIngredientCategories,
        ...ingredientSuggestions.map((ingredient) => ingredient.category),
        ...selectedIngredients.map((ingredient) => ingredient.category)
      ]),
    [ingredientSuggestions, selectedIngredients]
  );

  const totalStock = products.reduce((sum, product) => sum + product.totalStock, 0);
  const lowStockCount = products.filter((product) => product.totalStock <= 5).length;
  const featuredCount = products.filter((product) => product.isFeatured).length;
  const collectionCount = new Set(products.flatMap((product) => product.collections)).size;
  const productDiscountStatuses = products.map((product) => discountStatus(product, currentTime));
  const activeDiscountCount = productDiscountStatuses.filter(
    (discount) => discount.key === "active"
  ).length;
  const scheduledDiscountCount = productDiscountStatuses.filter(
    (discount) => discount.key === "scheduled"
  ).length;

  function openAddProduct() {
    setSelectedSeasons([]);
    setSelectedIngredients([]);
    setSelectedAvoidIf([]);
    setCreateVariants([{sizeML: "50", price: "", stock: "0"}]);
    setStatus("");
    setAddOpen(true);
  }

  function closeDetails() {
    setDeleteOpen(false);
    setDeleteError("");
    setDetails(null);
  }

  async function deleteProduct() {
    if (!details) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/fragrances/${details.id}`, {
        method: "DELETE"
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to delete product");

      closeDetails();
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function openDiscount(product: InventoryProduct) {
    setDiscountProduct(product);
    setDiscountType(product.discountType ?? "PERCENTAGE");
    setDiscountValue(product.discountValue ?? "");
    setDiscountStartsAt(toLocalDateTime(product.discountStartsAt));
    setDiscountExpiresAt(toLocalDateTime(product.discountExpiresAt));
    setDiscountError("");
    setDiscountActionError("");
  }

  function closeDiscount() {
    if (discountSubmitting) return;
    setDiscountProduct(null);
    setDiscountError("");
  }

  async function submitDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discountProduct) return;

    const numericValue = Number(discountValue);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setDiscountError("Enter a discount value greater than zero.");
      return;
    }
    if (discountType === "PERCENTAGE" && numericValue > 100) {
      setDiscountError("Percentage discounts cannot exceed 100%.");
      return;
    }

    const startsAt = localDateTimeToIso(discountStartsAt);
    const expiresAt = localDateTimeToIso(discountExpiresAt);
    if (discountStartsAt && !startsAt) {
      setDiscountError("Start time is invalid.");
      return;
    }
    if (discountExpiresAt && !expiresAt) {
      setDiscountError("End time is invalid.");
      return;
    }
    if (expiresAt) {
      const now = Date.now();
      const startsAtTime = startsAt ? new Date(startsAt).getTime() : now;
      const effectiveStart = Math.max(now, startsAtTime);
      if (new Date(expiresAt).getTime() <= effectiveStart) {
        setDiscountError(
          startsAtTime > now
            ? "End time must be after start time."
            : "End time must be in the future."
        );
        return;
      }
    }

    setDiscountSubmitting(true);
    setDiscountError("");

    try {
      const response = await fetch(
        `/api/admin/fragrances/${discountProduct.id}/discount`,
        {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            type: discountType,
            value: numericValue,
            startsAt,
            expiresAt
          })
        }
      );
      const result = (await response.json()) as {message?: string};
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to save discount");
      }

      setDiscountProduct(null);
      setCurrentTime(Date.now());
      router.refresh();
    } catch (error) {
      setDiscountError(error instanceof Error ? error.message : "Unable to save discount");
    } finally {
      setDiscountSubmitting(false);
    }
  }

  async function stopDiscount(product: InventoryProduct) {
    setStoppingDiscountId(product.id);
    setDiscountActionError("");

    try {
      const response = await fetch(`/api/admin/fragrances/${product.id}/discount`, {
        method: "DELETE"
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to stop discount");
      }

      setCurrentTime(Date.now());
      router.refresh();
    } catch (error) {
      setDiscountActionError(
        error instanceof Error ? error.message : "Unable to stop discount"
      );
    } finally {
      setStoppingDiscountId(null);
    }
  }

  function updateCreateVariant(index: number, key: keyof VariantDraft, value: string) {
    setCreateVariants((variants) =>
      variants.map((variant, variantIndex) =>
        variantIndex === index ? {...variant, [key]: value} : variant
      )
    );
  }

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    form.set("variants", JSON.stringify(createVariants));
    selectedSeasons.forEach((season) => form.append("seasons", season));
    form.set("ingredients", JSON.stringify(selectedIngredients));
    selectedAvoidIf.forEach((avoidIf) => form.append("avoidIf", avoidIf));

    try {
      const response = await fetch("/api/admin/fragrances", {
        method: "POST",
        body: form
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to create product");

      setAddOpen(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-container px-gutter py-10 text-parchment sm:py-12 lg:px-16">
      <header className="mb-10 border-b border-outline/60 pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="label-caps mb-3 text-gold">Admin Console</p>
            <h1 className="font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-tight">Inventory Management</h1>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inventory"
              className="w-full border-0 border-b border-outline bg-transparent pb-2 text-sm uppercase tracking-[0.12em] text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold focus:ring-0 sm:w-72"
            />
            <button type="button" onClick={openAddProduct} className="label-caps min-h-12 border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold">
              New Fragrance
            </button>
          </div>
        </div>
      </header>

      <section className="mb-10 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          ["Total Stock", totalStock],
          ["Low Stock Items", lowStockCount],
          ["Featured Products", featuredCount],
          ["Collections", collectionCount],
          ["Active Discounts", activeDiscountCount],
          ["Scheduled Discounts", scheduledDiscountCount]
        ].map(([label, value]) => (
          <div key={label} className="border border-outline/55 bg-surface/70 p-6">
            <p className="label-caps mb-4 text-on-surface/70">{label}</p>
            <p className="font-serif text-4xl text-parchment">{value}</p>
          </div>
        ))}
      </section>

      {inventoryStatus ? (
        <p role="status" className="mb-5 border border-gold/45 bg-gold/10 px-5 py-3 text-sm text-gold">
          {inventoryStatus}
        </p>
      ) : null}

      {discountActionError ? (
        <p role="alert" className="mb-5 border border-red-700/55 bg-red-950/30 px-5 py-3 text-sm text-red-300">
          {discountActionError}
        </p>
      ) : null}

      <section className="border border-outline/55 bg-surface/70">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline/60">
                {["Image", "Fragrance Name", "Order", "Collection", "Stock Level", "Price", "Discount", "Actions"].map((head) => (
                  <th key={head} className={`label-caps p-5 text-on-surface/70 ${head === "Actions" ? "text-right" : ""}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const name = isArabic ? product.nameAr : product.nameEn;
                const minPrice = product.minPrice ? Number(product.minPrice) : null;
                const maxPrice = product.maxPrice ? Number(product.maxPrice) : null;
                const stockPercent = Math.min((product.totalStock / 50) * 100, 100);
                const currentDiscountStatus = discountStatus(product, currentTime);
                const discountValueLabel = product.discountType === "PERCENTAGE"
                  ? `${Number(product.discountValue ?? 0)}% off`
                  : product.discountType === "FIXED" && product.discountValue
                    ? `${currency.format(Number(product.discountValue))} off`
                    : "No reduction configured";
                const discountTiming =
                  currentDiscountStatus.key === "scheduled" && product.discountStartsAt
                    ? `Starts ${dateTime.format(new Date(product.discountStartsAt))}`
                    : currentDiscountStatus.key === "active" && product.discountExpiresAt
                      ? `Ends ${dateTime.format(new Date(product.discountExpiresAt))}`
                      : currentDiscountStatus.key === "expired" && product.discountExpiresAt
                        ? `Ended ${dateTime.format(new Date(product.discountExpiresAt))}`
                        : currentDiscountStatus.key === "active"
                          ? "Runs until stopped"
                          : currentDiscountStatus.key === "stopped"
                            ? "Configuration saved"
                            : "Base pricing";
                return (
                  <tr key={product.id} className="border-b border-outline/25 transition-colors hover:bg-surface-hi">
                    <td className="p-5">
                      <div className="relative h-16 w-12 overflow-hidden bg-surface-mid">
                        {product.primaryImage ? <Image src={product.primaryImage.url} alt={name} fill sizes="48px" className="object-cover" /> : null}
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-serif text-xl leading-tight text-parchment">{name}</p>
                      <p className="mt-1 text-sm text-on-surface/60">SKU: {product.variants[0]?.sku ?? "No variants"}</p>
                    </td>
                    <td className="p-5 text-sm text-parchment">{product.position}</td>
                    <td className="p-5">
                      <span className="label-caps bg-surface-mid px-3 py-1 text-parchment">{product.collections[0] ?? "Unassigned"}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-32 bg-surface-mid"><div className={`h-full ${product.totalStock <= 5 ? "bg-red-700" : "bg-parchment"}`} style={{width: `${stockPercent}%`}} /></div>
                        <span className={`text-sm ${product.totalStock <= 5 ? "text-red-700" : "text-parchment"}`}>{product.totalStock} units</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm">
                      {minPrice ? maxPrice && maxPrice !== minPrice ? `${currency.format(minPrice)} - ${currency.format(maxPrice)}` : currency.format(minPrice) : "No price"}
                    </td>
                    <td className="p-5">
                      <div className="min-w-40">
                        <span className={`label-caps inline-flex border px-2.5 py-1 ${discountStatusStyles[currentDiscountStatus.key]}`}>
                          {currentDiscountStatus.label}
                        </span>
                        <p className="mt-2 text-sm text-parchment">{discountValueLabel}</p>
                        <p className="mt-1 text-xs leading-5 text-on-surface/55">{discountTiming}</p>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="ml-auto grid w-36 gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDiscount(product)}
                          className="label-caps inline-flex min-h-9 w-full items-center justify-center gap-2 border border-gold/55 bg-gold/10 px-3 text-gold transition-colors hover:border-gold hover:bg-gold hover:text-surface-hi"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0">
                            <path d="M4 7h10M4 17h16M17 4v6M8 14v6" />
                          </svg>
                          Apply Discount
                        </button>
                        {product.discountType && product.discountValue && product.discountIsActive ? (
                          <button
                            type="button"
                            onClick={() => void stopDiscount(product)}
                            disabled={stoppingDiscountId === product.id}
                            className="label-caps min-h-8 w-full border border-red-800/45 bg-red-950/20 px-3 text-red-400 transition-colors hover:border-red-600/70 hover:bg-red-950/40 hover:text-red-300 disabled:cursor-wait disabled:opacity-55"
                          >
                            {stoppingDiscountId === product.id ? "Stopping..." : "Stop Discount"}
                          </button>
                        ) : null}
                        <button type="button" onClick={() => setDetails(product)} className="label-caps inline-flex min-h-9 w-full items-center justify-center gap-2 border border-outline/65 bg-surface-hi/70 px-3 text-on-surface/75 transition-colors hover:border-parchment/65 hover:bg-surface-mid hover:text-parchment">
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0">
                            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 ? <p className="px-6 py-10 text-center text-sm text-on-surface/70">No inventory matches the current search.</p> : null}
      </section>

      <Modal
        isOpen={Boolean(discountProduct)}
        title={discountProduct ? `Apply Discount to ${isArabic ? discountProduct.nameAr : discountProduct.nameEn}` : "Apply Product Discount"}
        onClose={closeDiscount}
      >
        {discountProduct ? (
          <form onSubmit={submitDiscount} className="space-y-6">
            <div className="border border-outline/55 bg-surface/55 p-4">
              <p className="label-caps text-gold">Product-wide pricing</p>
              <p className="mt-2 text-sm leading-6 text-on-surface/70">
                This reduction applies to every available size. Base prices remain unchanged and return automatically when the discount stops.
              </p>
            </div>

            <fieldset>
              <legend className="label-caps mb-3 text-gold">Discount Type</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["PERCENTAGE", "Percentage", "A percentage off every size"],
                  ["FIXED", "Fixed amount", "The same EGP amount off every size"]
                ] as const).map(([value, label, description]) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      value={value}
                      checked={discountType === value}
                      onChange={() => setDiscountType(value)}
                      className="peer sr-only"
                    />
                    <span className={`block min-h-24 border p-4 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                      discountType === value
                        ? "border-gold bg-gold/10 text-parchment"
                        : "border-outline/70 bg-surface/40 text-on-surface/70 hover:border-gold/60"
                    }`}>
                      <span className="font-serif text-lg">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-on-surface/55">{description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label={discountType === "PERCENTAGE" ? "Percentage Off" : "Amount Off (EGP)"}>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max={discountType === "PERCENTAGE" ? "100" : undefined}
                  step="0.01"
                  required
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder={discountType === "PERCENTAGE" ? "15" : "250"}
                  className={`${inputClass()} pr-14`}
                />
                <span className="pointer-events-none absolute bottom-2 right-0 text-sm text-gold">
                  {discountType === "PERCENTAGE" ? "%" : "EGP"}
                </span>
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Start Time (Optional)">
                <input
                  type="datetime-local"
                  value={discountStartsAt}
                  onChange={(event) => setDiscountStartsAt(event.target.value)}
                  className={inputClass()}
                />
                <span className="mt-2 block text-xs leading-5 text-on-surface/55">
                  Leave blank to start immediately.
                </span>
              </Field>
              <Field label="End Time (Optional)">
                <input
                  type="datetime-local"
                  value={discountExpiresAt}
                  onChange={(event) => setDiscountExpiresAt(event.target.value)}
                  className={inputClass()}
                />
                <span className="mt-2 block text-xs leading-5 text-on-surface/55">
                  Leave blank to run until manually stopped.
                </span>
              </Field>
            </div>

            {discountError ? (
              <p role="alert" className="border border-red-700/55 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {discountError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDiscount}
                disabled={discountSubmitting}
                className="label-caps min-h-11 border border-outline px-6 text-parchment transition-colors hover:bg-surface-mid disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={discountSubmitting}
                className="label-caps min-h-11 border border-gold bg-gold px-6 text-bg transition-colors hover:bg-parchment disabled:cursor-wait disabled:opacity-60"
              >
                {discountSubmitting ? "Saving..." : "Save & Activate Discount"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      {details ? (
        <div className="fixed inset-0 z-[1000]">
          <button type="button" aria-label="Close product details" onClick={closeDetails} className="absolute inset-0 h-full w-full bg-parchment/35" />
          <aside className="absolute bottom-0 right-0 top-0 w-full max-w-2xl overflow-y-auto border-l border-outline bg-surface-hi p-8 shadow-[0_0_70px_rgba(74,47,22,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div><p className="label-caps mb-2 text-gold">Product Details</p><h2 className="font-serif text-4xl leading-tight">{isArabic ? details.nameAr : details.nameEn}</h2></div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Delete product"
                  title="Delete product"
                  onClick={() => {
                    setDeleteError("");
                    setDeleteOpen(true);
                  }}
                  className="flex h-10 w-10 items-center justify-center border border-red-700/60 text-red-500 transition-colors hover:border-red-500 hover:bg-red-950/40 hover:text-red-300"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" className="h-5 w-5">
                    <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                  </svg>
                </button>
                <button type="button" aria-label="Close product details" onClick={closeDetails} className="flex h-10 w-10 items-center justify-center text-2xl text-gold">x</button>
              </div>
            </div>
            <EditProductForm
              product={details}
              ingredientSuggestions={ingredientSuggestions}
              ingredientCategories={ingredientCategories}
              onClose={closeDetails}
              onSaved={(message) => {
                setInventoryStatus(message);
                closeDetails();
                router.refresh();
              }}
            />
          </aside>
          <Modal
            isOpen={deleteOpen}
            title="Delete Fragrance"
            onClose={() => {
              if (!deleting) setDeleteOpen(false);
            }}
          >
            <div className="space-y-6">
              <p className="text-sm leading-6 text-on-surface/80">
                Are you sure you want to permanently delete &ldquo;{isArabic ? details.nameAr : details.nameEn}&rdquo;? This action cannot be undone.
              </p>
              {deleteError ? <p role="alert" className="text-sm text-red-400">{deleteError}</p> : null}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                  className="label-caps min-h-11 border border-outline px-6 text-parchment transition-colors hover:bg-surface-mid disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteProduct}
                  disabled={deleting}
                  className="label-caps min-h-11 border border-red-500 bg-red-600 px-6 text-white shadow-[0_8px_24px_rgba(220,38,38,0.25)] transition-colors hover:border-red-400 hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:border-red-900 disabled:bg-red-950 disabled:text-red-300 disabled:shadow-none disabled:opacity-70"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {addOpen ? (
        <div className="fixed inset-0 z-[1000]">
          <button type="button" aria-label="Close add product" onClick={() => setAddOpen(false)} className="absolute inset-0 h-full w-full bg-parchment/35" />
          <aside className="absolute bottom-0 right-0 top-0 w-full max-w-2xl overflow-y-auto border-l border-outline bg-surface-hi p-8 shadow-[0_0_70px_rgba(74,47,22,0.25)]">
            <div className="mb-8 flex items-start justify-between gap-4"><div><p className="label-caps mb-2 text-gold">Inventory</p><h2 className="font-serif text-4xl leading-tight">New Fragrance</h2></div><button type="button" onClick={() => setAddOpen(false)} className="text-2xl text-gold">x</button></div>
            <form onSubmit={submitProduct} className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="English Name"><input name="nameEn" required className={inputClass()} /></Field>
                <Field label="Arabic Name (Optional)"><input name="nameAr" className={inputClass()} /></Field>
                <Field label="Slug"><input name="slug" required placeholder="rose-oud" className={inputClass()} /></Field>
                <Field label="English Tagline"><input name="taglineEn" required className={inputClass()} /></Field>
                <Field label="Arabic Tagline (Optional)"><input name="taglineAr" className={inputClass()} /></Field>
                <Field label="Gender"><ValentroSelect name="gender">{genders.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</ValentroSelect></Field>
                <Field label="Scent Profile"><ValentroSelect name="scentProfile">{scents.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</ValentroSelect></Field>
                <Field label="Sillage"><ValentroSelect name="sillage">{sillages.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</ValentroSelect></Field>
                <Field label="Longevity Hours"><input name="longevity" type="number" min="1" defaultValue="8" required className={inputClass()} /></Field>
                <Field label="Display Order"><input name="position" type="number" min="1" placeholder="1 displays first" className={inputClass()} /></Field>
                <Field label="Product Images">
                  <input name="images" type="file" accept="image/*" multiple className="w-full text-sm text-on-surface/80 file:mr-4 file:border file:border-parchment file:bg-transparent file:px-4 file:py-2 file:text-parchment file:transition-colors hover:file:border-gold hover:file:text-gold" />
                </Field>
              </div>
              <VariantEditor
                variants={createVariants}
                onChange={updateCreateVariant}
                onAdd={() =>
                  setCreateVariants((variants) => [
                    ...variants,
                    {sizeML: "", price: "", stock: "0"}
                  ])
                }
                onRemove={(index) =>
                  setCreateVariants((variants) =>
                    variants.length === 1
                      ? variants
                      : variants.filter((_, variantIndex) => variantIndex !== index)
                  )
                }
              />
              <Field label="English Description"><textarea name="descriptionEn" required rows={3} className={inputClass()} /></Field>
              <Field label="Arabic Description (Optional)"><textarea name="descriptionAr" rows={3} className={inputClass()} /></Field>
              <IngredientEditor
                suggestions={ingredientSuggestions}
                categories={ingredientCategories}
                selected={selectedIngredients}
                onChange={setSelectedIngredients}
              />
              <FinderRuleEditor
                label="Avoid If Customer"
                verbs={avoidanceVerbs}
                rules={selectedAvoidIf}
                ingredientOptions={uniqueTerms([
                  ...ingredientSuggestions.map((ingredient) => ingredient.name),
                  ...selectedIngredients.map((ingredient) => ingredient.name)
                ])}
                onChange={setSelectedAvoidIf}
              />
              <div>
                <p className="label-caps mb-3 text-gold">Best Seasons</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {seasons.map((season) => {
                    const allYearSelected = selectedSeasons.includes("ALL_YEAR");
                    const disabled = allYearSelected && season !== "ALL_YEAR";
                    return (
                      <label key={season} className={`label-caps flex items-center gap-2 ${disabled ? "text-on-surface/35" : "text-on-surface/80"}`}>
                        <input
                          type="checkbox"
                          checked={selectedSeasons.includes(season)}
                          disabled={disabled}
                          onChange={() =>
                            setSelectedSeasons((values) => {
                              if (season === "ALL_YEAR") {
                                return values.includes("ALL_YEAR") ? [] : ["ALL_YEAR"];
                              }
                              return values.includes(season)
                                ? values.filter((item) => item !== season)
                                : [...values.filter((item) => item !== "ALL_YEAR"), season];
                            })
                          }
                          className="h-4 w-4"
                        />
                        {formatEnum(season)}
                      </label>
                    );
                  })}
                </div>
              </div>
              {status ? <p className="text-sm text-gold">{status}</p> : null}
              <button type="submit" disabled={submitting} className="label-caps min-h-12 w-full border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:opacity-50">{submitting ? "Creating..." : "Create Product"}</button>
            </form>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function VariantEditor({
  variants,
  onChange,
  onAdd,
  onRemove
}: {
  variants: VariantDraft[];
  onChange: (index: number, key: keyof VariantDraft, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="label-caps text-gold">Available Sizes</p>
        <button
          type="button"
          onClick={onAdd}
          className="label-caps border border-outline px-3 py-2 text-parchment transition-colors hover:border-gold hover:text-gold"
        >
          Add Size
        </button>
      </div>
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div key={`${variant.id ?? "new"}-${index}`} className="grid gap-3 border border-outline/45 bg-surface/60 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="Size ML">
              <input
                type="number"
                min="1"
                value={variant.sizeML}
                onChange={(event) => onChange(index, "sizeML", event.target.value)}
                required
                className={inputClass()}
              />
            </Field>
            <Field label="Price">
              <input
                type="number"
                min="1"
                step="0.01"
                value={variant.price}
                onChange={(event) => onChange(index, "price", event.target.value)}
                required
                className={inputClass()}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min="0"
                value={variant.stock}
                onChange={(event) => onChange(index, "stock", event.target.value)}
                required
                className={inputClass()}
              />
            </Field>
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={variants.length === 1}
              className="label-caps self-end border border-outline px-3 py-2 text-on-surface/70 transition-colors hover:border-red-700 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProductForm({
  product,
  ingredientSuggestions,
  ingredientCategories,
  onClose,
  onSaved
}: {
  product: InventoryProduct;
  ingredientSuggestions: IngredientEntry[];
  ingredientCategories: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(product.seasons);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientEntry[]>(
    product.ingredients.map((ingredient) => ({
      name: ingredient.nameEn,
      category: ingredientCategoryFor(ingredient.nameEn, ingredient.category)
    }))
  );
  const [selectedAvoidIf, setSelectedAvoidIf] = useState<string[]>(
    product.avoidIf.filter((value) => parseFinderRule(value))
  );
  const [images, setImages] = useState<ImageDraft[]>(
    product.images.map((image, index) => ({
      id: image.id,
      url: image.url,
      altEn: image.altEn,
      altAr: image.altAr,
      position: image.position.toString(),
      isPrimary: image.isPrimary || index === 0,
      delete: false
    }))
  );
  const [variants, setVariants] = useState<VariantDraft[]>(
    product.variants.length > 0
      ? product.variants.map((variant) => ({
          id: variant.id,
          sizeML: variant.sizeML.toString(),
          price: variant.price,
          stock: variant.stock.toString()
        }))
      : [{sizeML: "50", price: "", stock: "0"}]
  );

  function updateVariant(index: number, key: keyof VariantDraft, value: string) {
    setVariants((items) =>
      items.map((variant, variantIndex) =>
        variantIndex === index ? {...variant, [key]: value} : variant
      )
    );
  }

  function updateImage(index: number, key: keyof ImageDraft, value: string | boolean) {
    setImages((items) =>
      items.map((image, imageIndex) => {
        if (imageIndex !== index) return image;
        return {...image, [key]: value};
      })
    );
  }

  function setPrimaryImage(index: number) {
    setImages((items) =>
      items.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
        delete: imageIndex === index ? false : image.delete
      }))
    );
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      slug: form.get("slug"),
      nameEn: form.get("nameEn"),
      nameAr: form.get("nameAr"),
      taglineEn: form.get("taglineEn"),
      taglineAr: form.get("taglineAr"),
      descriptionEn: form.get("descriptionEn"),
      descriptionAr: form.get("descriptionAr"),
      gender: form.get("gender"),
      scentProfile: form.get("scentProfile"),
      sillage: form.get("sillage"),
      longevity: form.get("longevity"),
      position: form.get("position"),
      ingredients: selectedIngredients,
      avoidIf: selectedAvoidIf,
      seasons: selectedSeasons,
      variants,
      images: images.map((image, index) => ({
        id: image.id,
        altEn: image.altEn,
        altAr: image.altAr,
        position: Number(image.position) || index + 1,
        isPrimary: image.isPrimary,
        delete: image.delete
      }))
    };
    const body = new FormData();
    body.set("payload", JSON.stringify(payload));
    form.getAll("newImages").forEach((file) => {
      if (file instanceof File && file.size > 0) {
        body.append("images", file);
      }
    });

    try {
      const response = await fetch(`/api/admin/fragrances/${product.id}`, {
        method: "PUT",
        body
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to update product");
      onSaved(result.message ?? "Product updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitEdit} className="mt-8 space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="English Name"><input name="nameEn" defaultValue={product.nameEn} required className={inputClass()} /></Field>
        <Field label="Arabic Name (Optional)"><input name="nameAr" defaultValue={product.nameAr === product.nameEn ? "" : product.nameAr} className={inputClass()} /></Field>
        <Field label="Slug"><input name="slug" defaultValue={product.slug} required className={inputClass()} /></Field>
        <Field label="English Tagline"><input name="taglineEn" defaultValue={product.taglineEn} required className={inputClass()} /></Field>
        <Field label="Arabic Tagline (Optional)"><input name="taglineAr" defaultValue={product.taglineAr === product.taglineEn ? "" : product.taglineAr} className={inputClass()} /></Field>
        <Field label="Gender"><ValentroSelect name="gender" defaultValue={product.gender}>{genders.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</ValentroSelect></Field>
        <Field label="Scent Profile"><ValentroSelect name="scentProfile" defaultValue={product.scentProfile}>{scents.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</ValentroSelect></Field>
        <Field label="Sillage"><ValentroSelect name="sillage" defaultValue={product.sillage}>{sillages.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</ValentroSelect></Field>
        <Field label="Longevity Hours"><input name="longevity" type="number" min="1" defaultValue={product.longevity} required className={inputClass()} /></Field>
        <Field label="Display Order"><input name="position" type="number" min="1" defaultValue={product.position} placeholder="Leave empty to move last" className={inputClass()} /></Field>
      </div>
      <Field label="English Description"><textarea name="descriptionEn" defaultValue={product.descriptionEn} required rows={3} className={inputClass()} /></Field>
      <Field label="Arabic Description (Optional)"><textarea name="descriptionAr" defaultValue={product.descriptionAr === product.descriptionEn ? "" : product.descriptionAr} rows={3} className={inputClass()} /></Field>
      <IngredientEditor
        suggestions={ingredientSuggestions}
        categories={ingredientCategories}
        selected={selectedIngredients}
        onChange={setSelectedIngredients}
      />
      <FinderRuleEditor
        label="Avoid If Customer"
        verbs={avoidanceVerbs}
        rules={selectedAvoidIf}
        ingredientOptions={uniqueTerms([
          ...ingredientSuggestions.map((ingredient) => ingredient.name),
          ...selectedIngredients.map((ingredient) => ingredient.name)
        ])}
        onChange={setSelectedAvoidIf}
      />
      <div>
        <p className="label-caps mb-3 text-gold">Best Seasons</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {seasons.map((season) => {
            const allYearSelected = selectedSeasons.includes("ALL_YEAR");
            const disabled = allYearSelected && season !== "ALL_YEAR";
            return (
              <label key={season} className={`label-caps flex items-center gap-2 ${disabled ? "text-on-surface/35" : "text-on-surface/80"}`}>
                <input
                  type="checkbox"
                  checked={selectedSeasons.includes(season)}
                  disabled={disabled}
                  onChange={() =>
                    setSelectedSeasons((values) => {
                      if (season === "ALL_YEAR") {
                        return values.includes("ALL_YEAR") ? [] : ["ALL_YEAR"];
                      }
                      return values.includes(season)
                        ? values.filter((item) => item !== season)
                        : [...values.filter((item) => item !== "ALL_YEAR"), season];
                    })
                  }
                  className="h-4 w-4"
                />
                {formatEnum(season)}
              </label>
            );
          })}
        </div>
      </div>
      <VariantEditor
        variants={variants}
        onChange={updateVariant}
        onAdd={() => setVariants((items) => [...items, {sizeML: "", price: "", stock: "0"}])}
        onRemove={(index) =>
          setVariants((items) =>
            items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index)
          )
        }
      />
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="label-caps text-gold">Product Images</p>
          <span className="text-xs text-on-surface/60">Set primary, edit alt text, or remove images</span>
        </div>
        <div className="space-y-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`grid gap-4 border p-4 sm:grid-cols-[96px_1fr] ${
                image.delete ? "border-red-700/60 opacity-60" : "border-outline/45"
              }`}
            >
              <div className="space-y-3">
                <div className="relative h-32 w-24 overflow-hidden bg-surface-mid">
                  <Image src={image.url} alt={image.altEn} fill sizes="96px" className="object-cover" />
                </div>
                <label className="label-caps flex items-center gap-2 text-on-surface/80">
                  <input
                    type="radio"
                    name="primaryImage"
                    checked={image.isPrimary}
                    disabled={image.delete}
                    onChange={() => setPrimaryImage(index)}
                  />
                  Primary
                </label>
                <label className="label-caps flex items-center gap-2 text-red-700">
                  <input
                    type="checkbox"
                    checked={image.delete}
                    onChange={(event) => updateImage(index, "delete", event.target.checked)}
                  />
                  Delete
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="English Alt Text">
                  <input
                    value={image.altEn}
                    onChange={(event) => updateImage(index, "altEn", event.target.value)}
                    disabled={image.delete}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Arabic Alt Text (Optional)">
                  <input
                    value={image.altAr}
                    onChange={(event) => updateImage(index, "altAr", event.target.value)}
                    disabled={image.delete}
                    placeholder={image.altEn}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Position">
                  <input
                    type="number"
                    min="1"
                    value={image.position}
                    onChange={(event) => updateImage(index, "position", event.target.value)}
                    disabled={image.delete}
                    className={inputClass()}
                  />
                </Field>
              </div>
            </div>
          ))}
          {images.length === 0 ? (
            <p className="border border-outline/45 p-4 text-sm text-on-surface/70">
              This product does not have images yet.
            </p>
          ) : null}
        </div>
        <Field label="Add New Images">
          <input
            name="newImages"
            type="file"
            accept="image/*"
            multiple
            className="w-full text-sm text-on-surface/80 file:mr-4 file:border file:border-parchment file:bg-transparent file:px-4 file:py-2 file:text-parchment file:transition-colors hover:file:border-gold hover:file:text-gold"
          />
        </Field>
      </div>
      {status ? <p className="text-sm text-gold">{status}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onClose} className="label-caps min-h-12 border border-outline px-6 text-parchment transition-colors hover:border-gold hover:text-gold">Cancel</button>
        <button type="submit" disabled={submitting} className="label-caps min-h-12 border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:opacity-50">{submitting ? "Saving..." : "Save Changes"}</button>
      </div>
    </form>
  );
}

function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  description
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  description?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const cleanedQuery = query.trim().replace(/\s+/g, " ");
  const menuId = `inventory-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}-menu`;
  const sameTerm = (first: string, second: string) =>
    first.trim().replace(/\s+/g, " ").toLocaleLowerCase() ===
    second.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const matchingOption = options.find((option) => sameTerm(option, cleanedQuery));
  const alreadySelected = selected.some((item) => sameTerm(item, cleanedQuery));
  const visibleOptions = options
    .filter((option) => option.toLocaleLowerCase().includes(cleanedQuery.toLocaleLowerCase()))
    .slice(0, 10);

  function toggle(option: string) {
    onChange(
      selected.some((item) => sameTerm(item, option))
        ? selected.filter((item) => !sameTerm(item, option))
        : [...selected, option]
    );
  }

  function addTypedValue() {
    if (!cleanedQuery || alreadySelected) return;
    onChange([...selected, matchingOption ?? cleanedQuery]);
    setQuery("");
    setIsOpen(false);
  }

  function chooseSuggestion(option: string) {
    toggle(option);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div>
      <p className="label-caps mb-2 text-gold">{label}</p>
      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTypedValue();
            }
            if (event.key === "Escape") setIsOpen(false);
          }}
          placeholder={`Type or search ${label.toLowerCase()}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-haspopup="listbox"
          className="label-caps min-h-10 w-full border border-outline bg-surface py-2 pl-4 pr-12 text-left text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
        />
        <button
          type="button"
          aria-label={`Show saved ${label.toLowerCase()}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen((open) => !open)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gold"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {isOpen ? (
          <div id={menuId} role="listbox" className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto border border-outline bg-surface p-1 shadow-[0_18px_45px_rgba(0,0,0,0.32)]">
            {visibleOptions.map((option) => {
              const isSelected = selected.some((item) => sameTerm(item, option));
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseSuggestion(option)}
                  className={`label-caps flex min-h-10 w-full items-center justify-between px-3 text-left transition-colors ${
                    isSelected
                      ? "bg-gold/15 text-gold"
                      : "text-parchment hover:bg-surface-mid hover:text-gold"
                  }`}
                >
                  {option}
                  {isSelected ? <span aria-hidden="true">✓</span> : null}
                </button>
              );
            })}
            {cleanedQuery && !alreadySelected ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={addTypedValue}
                className="label-caps flex min-h-10 w-full items-center border-t border-outline px-3 text-left text-gold transition-colors hover:bg-gold hover:text-surface-hi"
              >
                {matchingOption ? `Add \u201c${matchingOption}\u201d` : `Add new \u201c${cleanedQuery}\u201d`}
              </button>
            ) : null}
            {visibleOptions.length === 0 && !cleanedQuery ? (
              <p className="px-3 py-3 text-sm text-on-surface/60">No saved values yet.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-on-surface/55">
        {description ?? "Choose a saved value or type a new one and press Enter."}
      </p>
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <button
              key={`${item}-${selected.indexOf(item)}`}
              type="button"
              onClick={() => toggle(item)}
              className="label-caps border border-gold px-3 py-1 text-gold"
            >
              {item} x
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function IngredientEditor({
  suggestions,
  categories,
  selected,
  onChange
}: {
  suggestions: IngredientEntry[];
  categories: string[];
  selected: IngredientEntry[];
  onChange: (values: IngredientEntry[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const cleanedQuery = query.trim().replace(/\s+/g, " ");
  const menuId = "inventory-ingredient-suggestions";
  const sameTerm = (first: string, second: string) =>
    first.trim().replace(/\s+/g, " ").toLocaleLowerCase() ===
    second.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const matchingSuggestion = suggestions.find((ingredient) =>
    sameTerm(ingredient.name, cleanedQuery)
  );
  const alreadySelected = selected.some((ingredient) =>
    sameTerm(ingredient.name, cleanedQuery)
  );
  const visibleSuggestions = suggestions
    .filter((ingredient) =>
      ingredient.name.toLocaleLowerCase().includes(cleanedQuery.toLocaleLowerCase())
    )
    .slice(0, 10);
  const selectedCategory =
    category === "__new__" ? newCategory.trim().replace(/\s+/g, " ") : category;
  const canAdd = Boolean(
    cleanedQuery && !alreadySelected && (matchingSuggestion || selectedCategory)
  );

  function removeIngredient(name: string) {
    onChange(selected.filter((ingredient) => !sameTerm(ingredient.name, name)));
  }

  function addIngredient() {
    if (!canAdd) return;

    const ingredient = matchingSuggestion ?? {
      name: cleanedQuery,
      category: selectedCategory
    };
    onChange([...selected, ingredient]);
    setQuery("");
    setCategory("");
    setNewCategory("");
    setIsOpen(false);
  }

  function chooseSuggestion(ingredient: IngredientEntry) {
    setQuery(ingredient.name);
    setCategory(ingredient.category);
    setNewCategory("");
    setIsOpen(false);
  }

  return (
    <div>
      <p className="label-caps mb-2 text-gold">Ingredients</p>
      <p className="mb-4 text-xs leading-5 text-on-surface/60">
        Choose a saved note or add a new one. Every new ingredient needs a scent category.
      </p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(11rem,0.9fr)_auto] sm:items-end">
        <div className="relative">
          <span className="label-caps mb-2 block text-on-surface/65">Ingredient</span>
          <input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              const suggestion = suggestions.find((ingredient) => sameTerm(ingredient.name, value));
              if (suggestion) {
                setCategory(suggestion.category);
                setNewCategory("");
              }
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addIngredient();
              }
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder="Type or search an ingredient"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-haspopup="listbox"
            className="label-caps min-h-10 w-full border border-outline bg-surface py-2 pl-4 pr-4 text-left text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
          />
          {isOpen ? (
            <div
              id={menuId}
              role="listbox"
              className="absolute left-0 z-30 mt-2 max-h-72 w-full max-w-[calc(100vw-3rem)] overflow-y-auto border border-outline bg-surface p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.32)] sm:w-[30rem]"
            >
              {visibleSuggestions.map((ingredient) => {
                const isSelected = selected.some((item) =>
                  sameTerm(item.name, ingredient.name)
                );
                return (
                  <button
                    key={ingredient.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(ingredient)}
                    className={`label-caps grid min-h-12 w-full grid-cols-[minmax(0,1fr)_minmax(8rem,0.85fr)] items-center gap-4 border-b border-outline/15 px-3 py-2 text-left transition-colors last:border-b-0 ${
                      isSelected
                        ? "bg-gold/15 text-gold"
                        : "text-parchment hover:bg-surface-mid hover:text-gold"
                    }`}
                  >
                    <span className="min-w-0 leading-4">{ingredient.name}</span>
                    <span className="min-w-0 text-[10px] leading-4 text-on-surface/55">
                      {ingredient.category}
                    </span>
                  </button>
                );
              })}
              {visibleSuggestions.length === 0 && !cleanedQuery ? (
                <p className="px-3 py-3 text-sm text-on-surface/60">No saved ingredients yet.</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <span className="label-caps mb-2 block text-on-surface/65">Category</span>
          <ValentroSelect
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              if (event.target.value !== "__new__") setNewCategory("");
            }}
          >
            <option value="">Choose category</option>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="__new__">Add a new category...</option>
          </ValentroSelect>
        </div>
        <button
          type="button"
          onClick={addIngredient}
          disabled={!canAdd}
          className="label-caps min-h-10 border border-gold px-4 text-gold transition-colors hover:bg-gold hover:text-surface-hi disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add ingredient
        </button>
      </div>
      {category === "__new__" ? (
        <div className="mt-3 max-w-sm">
          <span className="label-caps mb-2 block text-on-surface/65">New category</span>
          <input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="For example, Mineral & Marine"
            maxLength={80}
            className="label-caps min-h-10 w-full border border-outline bg-surface px-4 text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold"
          />
        </div>
      ) : null}
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((ingredient) => (
            <button
              key={ingredient.name}
              type="button"
              onClick={() => removeIngredient(ingredient.name)}
              className="label-caps border border-gold px-3 py-1 text-gold"
            >
              {ingredient.name} <span className="text-on-surface/55">· {ingredient.category}</span> ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FinderRuleEditor({
  label,
  verbs,
  rules,
  ingredientOptions,
  onChange
}: {
  label: string;
  verbs: readonly FinderRuleVerb[];
  rules: string[];
  ingredientOptions: string[];
  onChange: (rules: string[]) => void;
}) {
  const [verb, setVerb] = useState<FinderRuleVerb>(verbs[0]);
  const [ingredient, setIngredient] = useState("");
  const parsedRules = rules.flatMap((value) => {
    const rule = parseFinderRule(value);
    return rule ? [{value, rule}] : [];
  });

  function addRule() {
    if (!ingredient) return;
    const nextRule = encodeFinderRule({verb, ingredient});
    if (rules.includes(nextRule)) return;
    onChange([...rules, nextRule]);
    setIngredient("");
  }

  return (
    <div className="border border-outline/60 bg-surface/45 p-4">
      <p className="label-caps text-gold">{label}</p>
      <p className="mt-2 text-xs leading-5 text-on-surface/60">
        Choose a customer preference and an ingredient. Legacy free-text rules are not used.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(12rem,1.2fr)_auto] sm:items-end">
        <label className="block">
          <span className="label-caps mb-2 block text-on-surface/65">Customer</span>
          <ValentroSelect value={verb} onChange={(event) => setVerb(event.target.value as FinderRuleVerb)}>
            {verbs.map((option) => (
              <option key={option} value={option}>{formatEnum(option)}</option>
            ))}
          </ValentroSelect>
        </label>
        <label className="block">
          <span className="label-caps mb-2 block text-on-surface/65">Ingredient</span>
          <ValentroSelect value={ingredient} onChange={(event) => setIngredient(event.target.value)}>
            <option value="">Select ingredient</option>
            {ingredientOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </ValentroSelect>
        </label>
        <button
          type="button"
          disabled={!ingredient}
          onClick={addRule}
          className="label-caps min-h-10 border border-gold px-4 text-gold transition-colors hover:bg-gold hover:text-surface-hi disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add rule
        </button>
      </div>
      {parsedRules.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {parsedRules.map(({value, rule}) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(rules.filter((item) => item !== value))}
              className="label-caps border border-gold px-3 py-1.5 text-gold transition-colors hover:bg-gold hover:text-surface-hi"
            >
              {finderRuleLabel(rule)} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
