"use client";

import Image from "next/image";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import type {MouseEvent} from "react";
import {useEffect, useMemo, useRef, useState} from "react";

import ValentroSelect from "@/components/ui/ValentroSelect";
import FragranceReference from "@/components/storefront/product/FragranceReference";
import OutOfStockBadge from "@/components/storefront/product/OutOfStockBadge";
import {productDiscountBadge} from "@/lib/product-discounts";
import type {ActiveProductDiscount} from "@/lib/product-discounts";
import {startProductImageTransition} from "@/lib/product-image-transition";

export type ShopFragrance = {
  id: string;
  slug: string;
  position: number;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  gender: string;
  scentProfile: string;
  referenceImageUrl: string | null;
  primaryImage: {
    url: string;
    altEn: string;
    altAr: string;
  } | null;
  ingredients: {
    nameEn: string;
    nameAr: string;
  }[];
  priceRange: {
    min: string | null;
    max: string | null;
  };
  originalPriceRange: {
    min: string | null;
    max: string | null;
  };
  discount: ActiveProductDiscount | null;
  variants: {price: string; stock: number}[];
};

export type ShopCollectionOffer = {
  id: string;
  slug: string;
  position: number;
  code: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImage: string;
  offerPrice: string | null;
  combinedValue: string;
  discountPercent: number;
  isAvailable: boolean;
  products: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    image: {
      url: string;
      altEn: string;
      altAr: string;
    } | null;
  }[];
};

type ShopClientProps = {
  locale: string;
  fragrances: ShopFragrance[];
  collections: ShopCollectionOffer[];
};

const genderOptions = [
  {value: "HER", label: "For Her"},
  {value: "HIM", label: "For Him"},
  {value: "UNISEX", label: "Unisex"}
];

const itemTypeOptions = [
  {value: "fragrance", label: "Fragrances"},
  {value: "collection", label: "Collections"}
];

const genderValues = genderOptions.map((option) => option.value);
const itemTypeValues = itemTypeOptions.map((option) => option.value);
const priceStep = 500;

const sortOptions = [
  {value: "position", label: "Curated"},
  {value: "price-asc", label: "Price low to high"},
  {value: "price-desc", label: "Price high to low"},
  {value: "name", label: "Name"}
];

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function priceNumber(value: string | null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

type CatalogItem =
  | {
      kind: "fragrance";
      position: number;
      fragrance: ShopFragrance;
    }
  | {
      kind: "collection";
      position: number;
      collection: ShopCollectionOffer;
    };

function itemName(item: CatalogItem, isArabic: boolean) {
  if (item.kind === "collection") {
    return isArabic ? item.collection.nameAr : item.collection.nameEn;
  }

  return isArabic ? item.fragrance.nameAr : item.fragrance.nameEn;
}

function itemMinPrice(item: CatalogItem) {
  return item.kind === "collection"
    ? priceNumber(item.collection.offerPrice)
    : priceNumber(item.fragrance.priceRange.min);
}

function itemMaxPrice(item: CatalogItem) {
  return item.kind === "collection"
    ? priceNumber(item.collection.offerPrice)
    : priceNumber(item.fragrance.priceRange.max);
}

function itemMatchesPriceRange(item: CatalogItem, min: number, max: number) {
  function isInRange(price: string | null) {
    if (price === null) return false;
    const amount = Number(price);
    return amount >= min && amount <= max;
  }

  return item.kind === "collection"
    ? isInRange(item.collection.offerPrice)
    : item.fragrance.variants.some(({price}) => isInRange(price));
}

function CheckboxFilter({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 text-sm leading-6 text-on-surface/80 transition-colors hover:text-parchment">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 appearance-none border border-outline bg-transparent transition-colors checked:border-parchment checked:bg-parchment focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
      />
      <span>{label}</span>
    </label>
  );
}

export default function ShopClient({
  locale,
  fragrances,
  collections
}: ShopClientProps) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedGender = searchParams.get("gender")?.toUpperCase() ?? "";
  const initialGender = genderValues.includes(requestedGender)
    ? requestedGender
    : "";
  const requestedItemType = searchParams.get("type")?.toLowerCase() ?? "";
  const initialItemType = itemTypeValues.includes(requestedItemType)
    ? requestedItemType
    : "";
  const [query, setQuery] = useState("");
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>(
    initialItemType ? [initialItemType] : []
  );
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    initialGender ? [initialGender] : []
  );

  function navigateToFragrance(
    event: MouseEvent<HTMLAnchorElement>,
    fragrance: ShopFragrance,
    imageAlt: string
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !fragrance.primaryImage
    ) {
      return;
    }

    const source = event.currentTarget.querySelector<HTMLElement>(
      "[data-product-transition-source]"
    );
    if (!source) return;

    const href = `/${locale}/fragrances/${fragrance.slug}`;
    const didStart = startProductImageTransition({
      slug: fragrance.slug,
      imageUrl: fragrance.primaryImage.url,
      imageAlt,
      source,
      navigate: () => router.push(href)
    });

    if (didStart) event.preventDefault();
  }

  function navigateToCollection(
    event: MouseEvent<HTMLAnchorElement>,
    collection: ShopCollectionOffer,
    imageAlt: string
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const source = event.currentTarget.querySelector<HTMLElement>(
      "[data-product-transition-source]"
    );
    if (!source) return;

    const href = `/${locale}/collections/${collection.slug}`;
    const didStart = startProductImageTransition({
      slug: collection.slug,
      imageUrl: collection.coverImage,
      imageAlt,
      source,
      navigate: () => router.push(href)
    });

    if (didStart) event.preventDefault();
  }
  const [selectedScents, setSelectedScents] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [sort, setSort] = useState("position");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const notesDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | null>(null);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  const scentOptions = useMemo(
    () =>
      Array.from(new Set(fragrances.map((fragrance) => fragrance.scentProfile)))
        .sort()
        .map((value) => ({value, label: formatEnum(value)})),
    [fragrances]
  );

  const noteOptions = useMemo(
    () =>
      Array.from(
        new Set(
          fragrances.flatMap((fragrance) =>
            fragrance.ingredients.map((ingredient) =>
              isArabic ? ingredient.nameAr : ingredient.nameEn
            )
          )
        )
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, locale)),
    [fragrances, isArabic, locale]
  );
  const normalizedNoteSearch = noteSearch.trim().toLocaleLowerCase(locale);
  const visibleNotes = noteOptions.filter((note) =>
    note.toLocaleLowerCase(locale).includes(normalizedNoteSearch)
  );

  const catalogItems = useMemo<CatalogItem[]>(
    () => [
      ...fragrances.map((fragrance) => ({
        kind: "fragrance" as const,
        position: fragrance.position,
        fragrance
      })),
      ...collections.map((collection) => ({
        kind: "collection" as const,
        position: collection.position,
        collection
      }))
    ],
    [collections, fragrances]
  );

  const priceCeiling = useMemo(() => {
    const highestPrice = catalogItems.reduce(
      (highest, item) => Math.max(highest, itemMaxPrice(item)),
      0
    );
    return Math.max(priceStep, Math.ceil(highestPrice / priceStep) * priceStep);
  }, [catalogItems]);
  const maxPrice = Math.min(selectedMaxPrice ?? priceCeiling, priceCeiling);
  const minPrice = Math.min(selectedMinPrice, maxPrice - priceStep);
  const hasPriceFilter = minPrice > 0 || maxPrice < priceCeiling;
  const minPriceLabel = priceFormatter.format(minPrice);
  const maxPriceLabel = priceFormatter.format(maxPrice);

  const filteredCatalogItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalogItems
      .filter((item) => {
        if (
          selectedItemTypes.length > 0 &&
          !selectedItemTypes.includes(item.kind)
        ) {
          return false;
        }

        if (hasPriceFilter && !itemMatchesPriceRange(item, minPrice, maxPrice)) {
          return false;
        }

        if (item.kind === "collection") {
          const collection = item.collection;
          const name = isArabic ? collection.nameAr : collection.nameEn;
          const description = isArabic
            ? collection.descriptionAr
            : collection.descriptionEn;
          const productNames = collection.products.flatMap((product) => [
            product.nameEn,
            product.nameAr
          ]);
          const haystack = [
            name,
            description,
            collection.code ?? "",
            collection.slug,
            ...productNames
          ]
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedQuery || haystack.includes(normalizedQuery);
          const fragranceOnlyFilters =
            selectedGenders.length > 0 ||
            selectedScents.length > 0 ||
            selectedNotes.length > 0;

          return matchesSearch && !fragranceOnlyFilters;
        }

        const fragrance = item.fragrance;
        const name = isArabic ? fragrance.nameAr : fragrance.nameEn;
        const tagline = isArabic ? fragrance.taglineAr : fragrance.taglineEn;
        const notes = fragrance.ingredients.map((ingredient) =>
          isArabic ? ingredient.nameAr : ingredient.nameEn
        );
        const haystack = [
          name,
          tagline,
          fragrance.gender,
          fragrance.scentProfile,
          ...notes
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedQuery || haystack.includes(normalizedQuery);
        const matchesGender =
          selectedGenders.length === 0 ||
          selectedGenders.includes(fragrance.gender);
        const matchesScent =
          selectedScents.length === 0 ||
          selectedScents.includes(fragrance.scentProfile);
        const matchesNotes =
          selectedNotes.length === 0 ||
          notes.some((note) => selectedNotes.includes(note));

        return matchesSearch && matchesGender && matchesScent && matchesNotes;
      })
      .sort((a, b) => {
        if (sort === "position") {
          return a.position - b.position;
        }
        if (sort === "price-asc") {
          return itemMinPrice(a) - itemMinPrice(b);
        }
        if (sort === "price-desc") {
          return itemMaxPrice(b) - itemMaxPrice(a);
        }
        if (sort === "name") {
          const aName = itemName(a, isArabic);
          const bName = itemName(b, isArabic);
          return aName.localeCompare(bName);
        }
        return 0;
      });
  }, [
    catalogItems,
    hasPriceFilter,
    isArabic,
    maxPrice,
    minPrice,
    query,
    selectedGenders,
    selectedItemTypes,
    selectedNotes,
    selectedScents,
    sort
  ]);

  const activeFilterCount =
    selectedItemTypes.length +
    selectedGenders.length +
    selectedScents.length +
    selectedNotes.length +
    (query ? 1 : 0) +
    (sort !== "position" ? 1 : 0) +
    (hasPriceFilter ? 1 : 0);

  const filterDialogOpen = filtersOpen || notesOpen;
  useEffect(() => {
    if (!filterDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filterDialogOpen]);

  function openNotes() {
    const dialog = notesDialogRef.current;
    if (!dialog || dialog.open) return;

    setNoteSearch("");
    dialog.showModal();
    setNotesOpen(true);
  }

  function resetPriceRange() {
    setSelectedMinPrice(0);
    setSelectedMaxPrice(null);
  }

  function resetFilters() {
    setQuery("");
    setSelectedItemTypes([]);
    setSelectedGenders([]);
    setSelectedScents([]);
    setSelectedNotes([]);
    setSort("position");
    resetPriceRange();
  }

  function formatFragrancePriceRange(range: ShopFragrance["priceRange"]) {
    const min = range.min === null ? Number.NaN : Number(range.min);
    const max = range.max === null ? Number.NaN : Number(range.max);

    if (!Number.isFinite(min)) return "Price on request";
    if (!Number.isFinite(max) || min === max) return priceFormatter.format(min);

    return `${priceFormatter.format(min)} - ${priceFormatter.format(max)}`;
  }

  function formatPrice(fragrance: ShopFragrance) {
    return formatFragrancePriceRange(fragrance.priceRange);
  }

  function formatOriginalPrice(fragrance: ShopFragrance) {
    return formatFragrancePriceRange(fragrance.originalPriceRange);
  }

  function formatDiscountBadge(discount: ActiveProductDiscount) {
    return productDiscountBadge(discount, (amount) => priceFormatter.format(amount));
  }

  function formatOfferPrice(collection: ShopCollectionOffer) {
    const price = priceNumber(collection.offerPrice);
    const combined = priceNumber(collection.combinedValue);

    return {
      price: price ? priceFormatter.format(price) : "Price on request",
      combined: combined ? priceFormatter.format(combined) : ""
    };
  }

  const filterControls = (
    <>
      <div className="relative mb-8">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search fragrances..."
          className="w-full border-0 border-b border-outline bg-transparent py-3 pr-9 text-sm text-parchment outline-none placeholder:text-on-surface/60 focus:border-gold focus:ring-0"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 text-gold"
        >
          <path d="m21 21-4.3-4.3" />
          <circle cx="11" cy="11" r="7" />
        </svg>
      </div>

      <div className="mb-8">
        <label
          htmlFor="shop-sort"
          className="label-caps mb-3 block text-parchment"
        >
          Sort
        </label>
        <ValentroSelect
          id="shop-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="min-h-12 text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ValentroSelect>
      </div>

      <div className="space-y-8">
        <fieldset>
          <legend className="label-caps mb-2 text-parchment">
            {isArabic ? "السعر" : "Price"}
          </legend>
          <p className="text-sm font-semibold text-parchment">
            {minPriceLabel} – {maxPriceLabel}
          </p>
          <div className="shop-price-slider relative my-2 h-10">
            <div aria-hidden="true" className="shop-price-slider-track absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-outline">
              <div
                className="absolute inset-y-0 rounded-full bg-gold"
                style={{
                  insetInlineStart: (minPrice / priceCeiling) * 100 + "%",
                  width: ((maxPrice - minPrice) / priceCeiling) * 100 + "%"
                }}
              />
            </div>
            <input
              type="range"
              aria-label={isArabic ? "الحد الأدنى للسعر" : "Minimum price"}
              aria-valuetext={minPriceLabel}
              min={0}
              max={priceCeiling}
              step={priceStep}
              value={minPrice}
              onChange={(event) =>
                setSelectedMinPrice(Math.min(event.currentTarget.valueAsNumber, maxPrice - priceStep))
              }
            />
            <input
              type="range"
              aria-label={isArabic ? "الحد الأقصى للسعر" : "Maximum price"}
              aria-valuetext={maxPriceLabel}
              min={0}
              max={priceCeiling}
              step={priceStep}
              value={maxPrice}
              onChange={(event) => {
                const price = Math.max(event.currentTarget.valueAsNumber, minPrice + priceStep);
                setSelectedMaxPrice(price === priceCeiling ? null : price);
              }}
            />
          </div>
          <button
            type="button"
            onClick={resetPriceRange}
            className="focus-gold text-sm text-gold underline underline-offset-4 hover:text-gold-muted"
          >
            {isArabic ? "إعادة ضبط نطاق السعر" : "Reset price range"}
          </button>
        </fieldset>

        <div>
          <h2 className="label-caps mb-4 border-b border-outline/70 pb-3 text-parchment">
            Type
          </h2>
          <div className="space-y-3">
            {itemTypeOptions.map((option) => (
              <CheckboxFilter
                key={option.value}
                label={option.label}
                checked={selectedItemTypes.includes(option.value)}
                onChange={() =>
                  setSelectedItemTypes((values) =>
                    toggleValue(values, option.value)
                  )
                }
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="label-caps mb-4 border-b border-outline/70 pb-3 text-parchment">
            Category
          </h2>
          <div className="space-y-3">
            {genderOptions.map((option) => (
              <CheckboxFilter
                key={option.value}
                label={option.label}
                checked={selectedGenders.includes(option.value)}
                onChange={() =>
                  setSelectedGenders((values) =>
                    toggleValue(values, option.value)
                  )
                }
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="label-caps mb-4 border-b border-outline/70 pb-3 text-parchment">
            Scent Profile
          </h2>
          <div className="space-y-3">
            {scentOptions.map((option) => (
              <CheckboxFilter
                key={option.value}
                label={option.label}
                checked={selectedScents.includes(option.value)}
                onChange={() =>
                  setSelectedScents((values) =>
                    toggleValue(values, option.value)
                  )
                }
              />
            ))}
          </div>
        </div>

        {noteOptions.length > 0 ? (
          <div>
            <h2 className="border-b border-outline/70">
              <button
                type="button"
                onClick={openNotes}
                aria-haspopup="dialog"
                aria-controls="shop-notes-drawer"
                aria-expanded={notesOpen}
                className="label-caps focus-gold flex min-h-11 w-full items-center justify-between gap-3 pb-3 text-parchment transition-colors hover:text-gold"
              >
                <span>
                  {isArabic ? "النوتات" : "Notes"}
                  {selectedNotes.length > 0 ? " (" + selectedNotes.length + ")" : ""}
                </span>
                <span aria-hidden="true" className="text-base text-gold">
                  {isArabic ? "←" : "→"}
                </span>
              </button>
            </h2>
          </div>
        ) : null}
      </div>

      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={resetFilters}
          className="label-caps mt-8 min-h-11 w-full border border-parchment px-5 text-parchment transition-colors hover:bg-parchment hover:text-surface-hi"
        >
          Clear Filters
        </button>
      ) : null}
    </>
  );

  return (
    <section className="bg-bg px-gutter pb-24 text-parchment lg:px-16">
      <div className="mx-auto max-w-container">
        <div className="mb-10 border-b border-outline/70 pb-8">
          <p className="label-caps mb-4 text-gold">Fragrance Catalogue</p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] leading-tight text-parchment">
                Shop Fragrances
              </h1>
            </div>
            <div className="label-caps text-on-surface/70">
              {filteredCatalogItems.length} of {catalogItems.length} items
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="label-caps inline-flex min-h-11 items-center gap-3 border border-parchment bg-parchment px-5 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M4 7h16M7 12h10M10 17h4" />
            </svg>
            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
          </button>
          <span className="label-caps text-on-surface/70">
            {filteredCatalogItems.length} shown
          </span>
        </div>

        {filtersOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className="fixed inset-0 z-[1000] lg:hidden"
          >
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
              className="absolute inset-0 h-full w-full bg-parchment/45"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[86svh] overflow-y-auto border-t border-outline bg-bg px-gutter pb-6 pt-5 shadow-[0_-18px_60px_rgba(74,47,22,0.22)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="label-caps text-gold">Catalogue</p>
                  <h2 className="font-serif text-3xl leading-tight text-parchment">
                    Filters
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="focus-gold flex h-11 w-11 items-center justify-center border border-outline text-parchment"
                  aria-label="Close filters"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="h-5 w-5"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {filterControls}

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="label-caps mt-6 min-h-12 w-full border border-parchment bg-parchment px-5 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
              >
                Show {filteredCatalogItems.length} Items
              </button>
            </div>
          </div>
        ) : null}

        <dialog
          ref={notesDialogRef}
          id="shop-notes-drawer"
          aria-labelledby="shop-notes-title"
          onClose={() => setNotesOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
          className="animate-cart-drawer-in fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-2xl flex-col overflow-hidden border-s border-outline bg-bg text-parchment shadow-2xl backdrop:bg-parchment/45 open:flex motion-reduce:animate-none"
        >
          <div className="shrink-0 border-b border-outline px-3 py-4 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="shop-notes-title" className="font-serif text-3xl">
                {isArabic ? "النوتات" : "Notes"}
              </h2>
              <button
                type="button"
                onClick={() => notesDialogRef.current?.close()}
                aria-label={isArabic ? "إغلاق النوتات" : "Close notes"}
                className="focus-gold flex h-11 w-11 items-center justify-center border border-outline text-2xl text-gold"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <input
              type="search"
              aria-label={isArabic ? "ابحث عن النوتات" : "Search notes"}
              placeholder={isArabic ? "ابحث عن النوتات..." : "Search notes..."}
              value={noteSearch}
              onChange={(event) => setNoteSearch(event.target.value)}
              className="focus-gold min-h-11 w-full border border-outline bg-surface px-3 text-sm text-parchment placeholder:text-on-surface/60"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6">
            {visibleNotes.length > 0 ? (
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {visibleNotes.map((note) => {
                  const selected = selectedNotes.includes(note);
                  return (
                    <button
                      key={note}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedNotes((values) => toggleValue(values, note))}
                      className={"focus-gold min-h-12 border px-1 py-2 text-xs leading-tight transition-colors [overflow-wrap:anywhere] sm:px-2 sm:text-sm " + (
                        selected
                          ? "border-parchment bg-parchment text-surface-hi"
                          : "border-outline bg-surface text-parchment hover:border-gold"
                      )}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p role="status" className="py-6 text-center text-sm text-on-surface/70">
                {isArabic ? "لا توجد نوتات مطابقة." : "No matching notes."}
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-outline px-3 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => notesDialogRef.current?.close()}
              className="label-caps focus-gold min-h-11 w-full bg-parchment px-5 text-surface-hi transition-colors hover:bg-gold"
            >
              {isArabic ? "تم" : "Done"}
            </button>
          </div>
        </dialog>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
          <aside
            aria-label="Fragrance filters"
            tabIndex={0}
            className="fragrance-filters focus-gold hidden lg:sticky lg:top-28 lg:block lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain lg:pr-3 lg:[scrollbar-gutter:stable]"
          >
            <div className="border-y border-outline/70 py-6 lg:border-t-0 lg:pt-0">
              {filterControls}
            </div>
          </aside>

          <div>
            {filteredCatalogItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14">
                {filteredCatalogItems.map((item, index) =>
                  item.kind === "fragrance" ? (
                    <FragranceCard
                      key={`fragrance-${item.fragrance.id}`}
                      fragrance={item.fragrance}
                      index={index}
                      locale={locale}
                      isArabic={isArabic}
                      formatPrice={formatPrice}
                      formatOriginalPrice={formatOriginalPrice}
                      formatDiscountBadge={formatDiscountBadge}
                      onNavigate={navigateToFragrance}
                    />
                  ) : (
                    <CollectionCard
                      key={`collection-${item.collection.id}`}
                      collection={item.collection}
                      index={index}
                      locale={locale}
                      isArabic={isArabic}
                      formatOfferPrice={formatOfferPrice}
                      onNavigate={navigateToCollection}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="border border-outline bg-surface px-6 py-10 text-center">
                <h2 className="font-serif text-3xl text-parchment">
                  No catalogue items found
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface/70">
                  Adjust the search or remove a few filters to return to the
                  full catalogue.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="label-caps mt-6 min-h-11 border border-parchment px-8 text-parchment transition-colors hover:bg-parchment hover:text-surface-hi"
                >
                  Reset Catalogue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FragranceCard({
  fragrance,
  index,
  locale,
  isArabic,
  formatPrice,
  formatOriginalPrice,
  formatDiscountBadge,
  onNavigate
}: {
  fragrance: ShopFragrance;
  index: number;
  locale: string;
  isArabic: boolean;
  formatPrice: (fragrance: ShopFragrance) => string;
  formatOriginalPrice: (fragrance: ShopFragrance) => string;
  formatDiscountBadge: (discount: ActiveProductDiscount) => string;
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    fragrance: ShopFragrance,
    imageAlt: string
  ) => void;
}) {
  const name = isArabic ? fragrance.nameAr : fragrance.nameEn;
  const isOutOfStock = !fragrance.variants.some((variant) => variant.stock > 0);
  const tagline = isArabic ? fragrance.taglineAr : fragrance.taglineEn;
  const imageAlt = fragrance.primaryImage
    ? isArabic
      ? fragrance.primaryImage.altAr
      : fragrance.primaryImage.altEn
    : name;

  return (
    <Link
      href={`/${locale}/fragrances/${fragrance.slug}`}
      onClick={(event) => onNavigate(event, fragrance, imageAlt)}
      data-product-image-transition-link
      className="group block"
    >
      <div
        data-product-transition-source
        className="relative mb-4 aspect-[3/4] overflow-hidden bg-surface"
      >
        {fragrance.primaryImage ? (
          <Image
            src={fragrance.primaryImage.url}
            alt={imageAlt}
            fill
            unoptimized
            loading={index < 8 ? "eager" : "lazy"}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 24vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        ) : null}
        {!fragrance.primaryImage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,248,236,0.96),rgba(227,210,186,0.72))] px-5 text-center font-serif text-2xl leading-tight text-parchment/45">
            {name}
          </div>
        ) : null}
        <FragranceReference
          imageUrl={fragrance.referenceImageUrl}
          productName={name}
          isArabic={isArabic}
        />
        {isOutOfStock ? <OutOfStockBadge isArabic={isArabic} /> : null}
        {fragrance.discount ? (
          <span className={"label-caps absolute end-3 z-20 bg-gold px-3 py-2 text-surface-hi " + (isOutOfStock ? "bottom-12" : "bottom-3")}>
            {formatDiscountBadge(fragrance.discount)}
          </span>
        ) : null}
      </div>
      <div className="text-center">
        <p className="label-caps mb-2 text-gold">{formatEnum(fragrance.scentProfile)}</p>
        <h2 className="font-serif text-[clamp(1.35rem,2.6vw,1.9rem)] leading-tight text-parchment">
          {name}
        </h2>
        <p className="mx-auto mt-2 line-clamp-2 min-h-10 max-w-[17rem] text-sm leading-5 text-on-surface/70">
          {tagline}
        </p>
        {fragrance.discount ? (
          <div className="label-caps mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="text-on-surface/45 line-through decoration-on-surface/45">
              {formatOriginalPrice(fragrance)}
            </span>
            <span className="text-gold">{formatPrice(fragrance)}</span>
          </div>
        ) : (
          <p className="label-caps mt-3 text-on-surface/70">
            {formatPrice(fragrance)}
          </p>
        )}
      </div>
    </Link>
  );
}

function CollectionCard({
  collection,
  index,
  locale,
  isArabic,
  formatOfferPrice,
  onNavigate
}: {
  collection: ShopCollectionOffer;
  index: number;
  locale: string;
  isArabic: boolean;
  formatOfferPrice: (collection: ShopCollectionOffer) => {
    price: string;
    combined: string;
  };
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    collection: ShopCollectionOffer,
    imageAlt: string
  ) => void;
}) {
  const name = isArabic ? collection.nameAr : collection.nameEn;
  const description = isArabic ? collection.descriptionAr : collection.descriptionEn;
  const prices = formatOfferPrice(collection);

  return (
    <Link
      href={`/${locale}/collections/${collection.slug}`}
      onClick={(event) => onNavigate(event, collection, name)}
      data-product-image-transition-link
      className="group block"
    >
      <div
        data-product-transition-source
        className="relative mb-4 aspect-[3/4] overflow-hidden border border-gold/50 bg-surface"
      >
        <Image
          src={collection.coverImage}
          alt={name}
          fill
          unoptimized
          loading={index < 8 ? "eager" : "lazy"}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 24vw, (min-width: 768px) 30vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
        <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-1">
          <span className="label-caps bg-parchment px-2 py-2 text-surface-hi">
            Collection
          </span>
          {collection.discountPercent > 0 ? (
            <span className="label-caps bg-gold px-2 py-2 text-surface-hi">
              {collection.discountPercent}% off
            </span>
          ) : null}
        </div>
        {collection.isAvailable ? null : <OutOfStockBadge isArabic={isArabic} />}
        <div className={"absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 via-bg/45 to-transparent px-4 pt-16 " + (collection.isAvailable ? "pb-4" : "pb-12")}>
          <div className="flex -space-x-2">
            {collection.products.slice(0, 3).map((product) => {
              const productName = isArabic ? product.nameAr : product.nameEn;
              const productAlt = product.image
                ? isArabic
                  ? product.image.altAr
                  : product.image.altEn
                : productName;

              return (
                <span
                  key={product.id}
                  className="relative block h-10 w-10 overflow-hidden border border-parchment bg-surface-mid"
                >
                  {product.image ? (
                    <Image
                      src={product.image.url}
                      alt={productAlt}
                      fill
                      unoptimized
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="label-caps mb-2 text-gold">
          {collection.products.length} piece collection
        </p>
        <h2 className="font-serif text-[clamp(1.35rem,2.6vw,1.9rem)] leading-tight text-parchment">
          {name}
        </h2>
        <p className="mx-auto mt-2 line-clamp-2 max-w-[17rem] text-sm leading-5 text-on-surface/70">
          {description || "A limited bundle curated by Valentro."}
        </p>
        <p className="label-caps mt-2 text-on-surface/70">
          {prices.price}
          {prices.combined ? (
            <span className="ml-2 text-on-surface/45 line-through">{prices.combined}</span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
