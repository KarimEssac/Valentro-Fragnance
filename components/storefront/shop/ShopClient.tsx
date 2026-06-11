"use client";

import Image from "next/image";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {useEffect, useMemo, useState} from "react";

export type ShopFragrance = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  gender: string;
  scentProfile: string;
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
};

type ShopClientProps = {
  locale: string;
  fragrances: ShopFragrance[];
};

const genderOptions = [
  {value: "HER", label: "For Her"},
  {value: "HIM", label: "For Him"},
  {value: "UNISEX", label: "Unisex"}
];

const genderValues = genderOptions.map((option) => option.value);

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

export default function ShopClient({locale, fragrances}: ShopClientProps) {
  const isArabic = locale === "ar";
  const searchParams = useSearchParams();
  const requestedGender = searchParams.get("gender")?.toUpperCase() ?? "";
  const initialGender = genderValues.includes(requestedGender)
    ? requestedGender
    : "";
  const [query, setQuery] = useState("");
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    initialGender ? [initialGender] : []
  );
  const [selectedScents, setSelectedScents] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [sort, setSort] = useState("position");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 12),
    [fragrances, isArabic]
  );

  const filteredFragrances = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return fragrances
      .filter((fragrance) => {
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
        if (sort === "price-asc") {
          return priceNumber(a.priceRange.min) - priceNumber(b.priceRange.min);
        }
        if (sort === "price-desc") {
          return priceNumber(b.priceRange.max) - priceNumber(a.priceRange.max);
        }
        if (sort === "name") {
          const aName = isArabic ? a.nameAr : a.nameEn;
          const bName = isArabic ? b.nameAr : b.nameEn;
          return aName.localeCompare(bName);
        }
        return 0;
      });
  }, [
    fragrances,
    isArabic,
    query,
    selectedGenders,
    selectedNotes,
    selectedScents,
    sort
  ]);

  const hasFilters =
    query ||
    selectedGenders.length > 0 ||
    selectedScents.length > 0 ||
    selectedNotes.length > 0 ||
    sort !== "position";

  const activeFilterCount =
    selectedGenders.length +
    selectedScents.length +
    selectedNotes.length +
    (query ? 1 : 0) +
    (sort !== "position" ? 1 : 0);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  function resetFilters() {
    setQuery("");
    setSelectedGenders([]);
    setSelectedScents([]);
    setSelectedNotes([]);
    setSort("position");
  }

  function formatPrice(fragrance: ShopFragrance) {
    const min = priceNumber(fragrance.priceRange.min);
    const max = priceNumber(fragrance.priceRange.max);

    if (!min) return "Price on request";
    if (!max || min === max) return priceFormatter.format(min);

    return `${priceFormatter.format(min)} - ${priceFormatter.format(max)}`;
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
        <select
          id="shop-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="w-full border border-outline bg-transparent px-3 py-3 text-sm text-parchment outline-none focus:border-gold focus:ring-0"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-8">
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
            <h2 className="label-caps mb-4 border-b border-outline/70 pb-3 text-parchment">
              Notes
            </h2>
            <div className="space-y-3">
              {noteOptions.map((note) => (
                <CheckboxFilter
                  key={note}
                  label={note}
                  checked={selectedNotes.includes(note)}
                  onChange={() =>
                    setSelectedNotes((values) => toggleValue(values, note))
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {hasFilters ? (
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
    <section className="bg-bg px-gutter pb-24 pt-10 text-parchment sm:pt-14 lg:px-16">
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
              {filteredFragrances.length} of {fragrances.length} products
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
            Filters
            {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </button>
          <span className="label-caps text-on-surface/70">
            {filteredFragrances.length} shown
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
                Show {filteredFragrances.length} Products
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
          <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
            <div className="border-y border-outline/70 py-6 lg:border-t-0 lg:pt-0">
              {filterControls}
            </div>
          </aside>

          <div>
            {filteredFragrances.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14">
                {filteredFragrances.map((fragrance, index) => {
                  const name = isArabic ? fragrance.nameAr : fragrance.nameEn;
                  const tagline = isArabic
                    ? fragrance.taglineAr
                    : fragrance.taglineEn;
                  const imageAlt = fragrance.primaryImage
                    ? isArabic
                      ? fragrance.primaryImage.altAr
                      : fragrance.primaryImage.altEn
                    : name;

                  return (
                    <Link
                      key={fragrance.id}
                      href={`/${locale}/fragrances/${fragrance.slug}`}
                      className="group block"
                    >
                      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-surface">
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
                      </div>
                      <div className="text-center">
                        <p className="label-caps mb-2 text-gold">
                          {formatEnum(fragrance.scentProfile)}
                        </p>
                        <h2 className="font-serif text-[clamp(1.35rem,2.6vw,1.9rem)] leading-tight text-parchment">
                          {name}
                        </h2>
                        <p className="mx-auto mt-2 line-clamp-2 min-h-10 max-w-[17rem] text-sm leading-5 text-on-surface/70">
                          {tagline}
                        </p>
                        <p className="label-caps mt-3 text-on-surface/70">
                          {formatPrice(fragrance)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="border border-outline bg-surface px-6 py-10 text-center">
                <h2 className="font-serif text-3xl text-parchment">
                  No fragrances found
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
