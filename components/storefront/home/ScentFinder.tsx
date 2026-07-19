"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import {useRouter} from "next/navigation";
import type {MouseEvent} from "react";
import {useEffect, useMemo, useState} from "react";

import {startProductImageTransition} from "@/lib/product-image-transition";
import {
  buildFinderAliasMap,
  normalizeFinderTerm,
  scoreFragranceMatch
} from "@/lib/scent-finder-logic";
import {
  ingredientCategoryFor,
  ingredientCategoryIcon,
  ingredientCategoryLabel,
  ingredientCategorySortOrder,
  ingredientFinderIcon,
  ingredientFinderImage
} from "@/lib/ingredient-categories";

type FinderFragrance = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  gender: string;
  scentProfile: string;
  avoidIf: string[];
  seasons: string[];
  sillage: string;
  isFeatured: boolean;
  ingredients: {
    nameEn: string;
    nameAr: string;
    category: string;
  }[];
  primaryImage: {
    url: string;
    altEn: string;
    altAr: string;
  } | null;
  priceRange: {
    min: string | null;
    max: string | null;
  };
};

type FinderStep = "audience" | "love" | "avoid" | "season" | "presence" | "results";

type ScoredFragrance = FinderFragrance & {
  match: number;
  displayMatch: number;
};

type FinderIngredient = {
  key: string;
  name: string;
  category: string;
  frequency: number;
  profileMatches: number;
  featuredFrequency: number;
};

type IngredientCategoryGroup = {
  category: string;
  ingredients: FinderIngredient[];
};

const audienceOptions = [
  {value: "HER", label: "For Her", icon: "♀"},
  {value: "HIM", label: "For Him", icon: "♂"},
  {value: "UNISEX", label: "Unisex", icon: "∞"}
];

const seasonOptions = [
  {value: "SPRING", label: "Spring", icon: "✿"},
  {value: "SUMMER", label: "Summer", icon: "☀"},
  {value: "FALL", label: "Fall", icon: "◒"},
  {value: "WINTER", label: "Winter", icon: "❄"},
  {value: "ALL_YEAR", label: "All Year", icon: "∞"}
];

const presenceOptions = [
  {value: "SOFT_LANDING", label: "Soft Landing", icon: "☁"},
  {value: "MODERATE", label: "Moderate", icon: "◐"},
  {value: "NOTICEABLE", label: "Noticeable", icon: "✦"},
  {value: "STRONG", label: "Strong", icon: "✶"},
  {value: "ENORMOUS", label: "Enormous", icon: "✹"},
  {value: "FILLS_THE_ROOM", label: "Fills the Room", icon: "✺"}
];

const steps: FinderStep[] = [
  "audience",
  "love",
  "avoid",
  "season",
  "presence",
  "results"
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

export default function ScentFinder() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<FinderStep>("audience");
  const [fragrances, setFragrances] = useState<FinderFragrance[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [audience, setAudience] = useState("");
  const [loved, setLoved] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [presences, setPresences] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingStage, setMatchingStage] = useState(0);

  const currentStepIndex = steps.indexOf(step);
  const progress = isMatching
    ? 100
    : ((currentStepIndex + 1) / steps.length) * 100;
  const canContinue =
    step === "audience"
      ? Boolean(audience)
      : step === "love"
        ? loved.length > 0
        : step === "season"
          ? seasons.length > 0
          : step === "presence"
            ? presences.length > 0
            : true;

  const ingredientCatalog = useMemo<FinderIngredient[]>(() => {
    const byIngredient = new Map<string, FinderIngredient>();

    fragrances.forEach((fragrance) => {
      const profile = normalizeFinderTerm(formatEnum(fragrance.scentProfile));
      fragrance.ingredients.forEach((ingredient) => {
        const key = normalizeFinderTerm(ingredient.nameEn);
        if (!key) return;

        const existing = byIngredient.get(key);
        const name = isArabic ? ingredient.nameAr || ingredient.nameEn : ingredient.nameEn;
        const category = ingredientCategoryFor(ingredient.nameEn, ingredient.category);
        const profileMatches = key.includes(profile) ? 1 : 0;

        if (existing) {
          existing.frequency += 1;
          existing.profileMatches += profileMatches;
          existing.featuredFrequency += fragrance.isFeatured ? 1 : 0;
          return;
        }

        byIngredient.set(key, {
          key,
          name,
          category,
          frequency: 1,
          profileMatches,
          featuredFrequency: fragrance.isFeatured ? 1 : 0
        });
      });
    });

    return [...byIngredient.values()].sort((first, second) =>
      first.name.localeCompare(second.name)
    );
  }, [fragrances, isArabic]);

  const quickPicks = useMemo(() => {
    const ranked = [...ingredientCatalog].sort(
      (first, second) =>
        second.frequency - first.frequency ||
        second.profileMatches - first.profileMatches ||
        second.featuredFrequency - first.featuredFrequency ||
        first.name.localeCompare(second.name)
    );
    const picked: FinderIngredient[] = [];

    for (const category of [...new Set(ranked.map((ingredient) => ingredient.category))].sort(
      (first, second) => ingredientCategorySortOrder(first) - ingredientCategorySortOrder(second)
    )) {
      const ingredient = ranked.find((candidate) => candidate.category === category);
      if (ingredient) picked.push(ingredient);
      if (picked.length === 6) return picked;
    }

    ranked.forEach((ingredient) => {
      if (picked.length >= 6 || picked.some((pick) => pick.key === ingredient.key)) return;
      picked.push(ingredient);
    });

    return picked;
  }, [ingredientCatalog]);

  const ingredientCategories = useMemo<IngredientCategoryGroup[]>(() => {
    const groups = new Map<string, FinderIngredient[]>();

    ingredientCatalog.forEach((ingredient) => {
      const current = groups.get(ingredient.category) ?? [];
      current.push(ingredient);
      groups.set(ingredient.category, current);
    });

    return [...groups.entries()]
      .map(([category, ingredients]) => ({
        category,
        ingredients: ingredients.sort((first, second) => first.name.localeCompare(second.name))
      }))
      .sort(
        (first, second) =>
          ingredientCategorySortOrder(first.category) - ingredientCategorySortOrder(second.category) ||
          first.category.localeCompare(second.category)
      );
  }, [ingredientCatalog]);

  const aliases = useMemo(
    () => buildFinderAliasMap(fragrances),
    [fragrances]
  );

  const results = useMemo<ScoredFragrance[]>(() => {
    const scored = fragrances
      .map((fragrance) => ({
        ...fragrance,
        match: scoreFragranceMatch(
          fragrance,
          {
            audience,
            loved,
            avoided,
            seasons,
            presences
          },
          aliases
        ),
        displayMatch: 0
      }))
      .filter((fragrance) => fragrance.match > 0)
      .sort((a, b) => b.match - a.match);

    return scored.map((fragrance) => ({
      ...fragrance,
      displayMatch: fragrance.match
    }));
  }, [aliases, audience, avoided, fragrances, loved, presences, seasons]);

  useEffect(() => {
    if (!isOpen || status !== "loading") return;

    let isMounted = true;

    async function loadFragrances() {
      try {
        const response = await fetch(
          "/api/storefront/fragrances?finder=true&limit=100",
          {headers: {Accept: "application/json"}}
        );
        if (!response.ok) throw new Error("Unable to load fragrances");

        const data = (await response.json()) as FinderFragrance[];
        if (isMounted) {
          setFragrances(data);
          setStatus("ready");
        }
      } catch {
        if (isMounted) setStatus("error");
      }
    }

    loadFragrances();

    return () => {
      isMounted = false;
    };
  }, [isOpen, status]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isMatching) return;

    const secondStage = window.setTimeout(() => setMatchingStage(1), 2_000);
    const finalStage = window.setTimeout(() => setMatchingStage(2), 4_000);
    const complete = window.setTimeout(() => {
      setIsMatching(false);
      setStep("results");
    }, 6_000);

    return () => {
      window.clearTimeout(secondStage);
      window.clearTimeout(finalStage);
      window.clearTimeout(complete);
    };
  }, [isMatching]);

  function openFinder() {
    if (status === "idle") setStatus("loading");
    setIsOpen(true);
  }

  function closeFinder() {
    setIsMatching(false);
    setIsOpen(false);
  }

  function nextStep() {
    if (step === "results") return;
    if (step === "presence") {
      setMatchingStage(0);
      setIsMatching(true);
      return;
    }
    const next = steps[currentStepIndex + 1] ?? "results";
    setStep(next);
  }

  function skipCurrentStep() {
    if (step === "audience") setAudience("");
    if (step === "love") setLoved([]);
    if (step === "avoid") setAvoided([]);
    if (step === "season") setSeasons([]);
    if (step === "presence") setPresences([]);
    nextStep();
  }

  function previousStep() {
    if (isMatching) {
      setIsMatching(false);
      return;
    }
    if (currentStepIndex <= 0) return;
    setStep(steps[currentStepIndex - 1]);
  }

  function resetFinder() {
    setIsMatching(false);
    setStep("audience");
    setAudience("");
    setLoved([]);
    setAvoided([]);
    setSeasons([]);
    setPresences([]);
  }

  const selectedLoved = new Set(loved.map(normalizeFinderTerm));

  function handleResultClick(
    event: MouseEvent<HTMLAnchorElement>,
    fragrance: ScoredFragrance,
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

  return (
    <>
      <button
        type="button"
        onClick={openFinder}
        className="focus-gold fixed bottom-5 right-5 z-[90] grid h-20 w-20 place-items-center border border-gold bg-parchment text-surface-hi shadow-[0_18px_44px_rgba(47,36,27,0.28)] transition-transform duration-300 hover:-translate-y-1 hover:bg-gold md:bottom-8 md:right-8 md:h-24 md:w-24"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open scent finder"
      >
        <span className="absolute inset-2 border border-surface-hi/28" />
        <span className="relative flex flex-col items-center gap-1">
          <span className="font-serif text-2xl leading-none md:text-3xl">V</span>
          <span className="label-caps text-[9px] leading-3 text-surface-hi md:text-[10px]">
            Scent
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Scent finder"
          className="animate-scent-backdrop-in fixed inset-0 z-[1000] flex items-center justify-center bg-parchment/45 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeFinder}
            aria-label="Close scent finder"
          />
          <div className="animate-scent-modal-in relative flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden border border-umber bg-[#F9F6F0] text-[#201B11] shadow-[0_24px_70px_rgba(32,27,17,0.18)]">
            <div className="h-[2px] bg-[#EAE4D8]">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-500"
                style={{width: `${progress}%`}}
              />
            </div>

            <div className="flex items-center justify-between border-b border-[#7A6A4F]/30 px-5 py-4 sm:px-6">
              <div className="label-caps text-[#7A6A4F]">
                {isMatching
                  ? "Matching"
                  : step === "results"
                  ? `${results.length} Matches`
                  : `Step ${currentStepIndex + 1} of ${steps.length - 1}`}
              </div>
              <div className="font-serif text-3xl leading-none">Valentro</div>
              <button
                type="button"
                onClick={closeFinder}
                className="focus-gold flex h-9 w-9 items-center justify-center border border-transparent text-2xl leading-none text-[#4B463E] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                aria-label="Close scent finder"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-10 md:px-16">
              {status === "loading" ? (
                <div className="animate-scent-step-in flex min-h-[360px] items-center justify-center text-center">
                  <div>
                    <p className="label-caps mb-4 text-[#7A6A4F]">Preparing</p>
                    <h2 className="font-serif text-4xl leading-tight">
                      Reading the collection
                    </h2>
                  </div>
                </div>
              ) : null}

              {status === "error" ? (
                <div className="animate-scent-step-in mx-auto max-w-xl border border-[#7A6A4F]/40 p-8 text-center">
                  <h2 className="font-serif text-4xl leading-tight">
                    The finder could not load
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-[#4B463E]">
                    Try again in a moment, or browse the collection directly.
                  </p>
                </div>
              ) : null}

              {status === "ready" && isMatching ? (
                <ScentMatchingStage stage={matchingStage} />
              ) : null}

              {status === "ready" && !isMatching && step === "audience" ? (
                <Question
                  key="audience"
                  title="For whom is this selection?"
                  onSkip={skipCurrentStep}
                >
                  <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                    {audienceOptions.map((option, index) => (
                      <OptionButton
                        key={option.value}
                        delay={index * 55}
                        active={audience === option.value}
                        onClick={() => setAudience(option.value)}
                      >
                        <span className="font-serif text-5xl leading-none text-[#7A6A4F] transition-colors group-hover:text-[#D4AF37]">
                          {option.icon}
                        </span>
                        <span className="label-caps">{option.label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </Question>
              ) : null}

              {status === "ready" && !isMatching && step === "love" ? (
                <Question
                  key="love"
                  title="What do they love?"
                  subtitle="Pick notes they adore."
                  onSkip={skipCurrentStep}
                >
                  <NotePicker
                    quickPicks={quickPicks}
                    categories={ingredientCategories}
                    isArabic={isArabic}
                    selected={loved}
                    onToggle={(value) => {
                      setLoved((values) => toggleValue(values, value));
                      setAvoided((values) =>
                        values.filter(
                          (item) =>
                            normalizeFinderTerm(item) !== normalizeFinderTerm(value)
                        )
                      );
                    }}
                  />
                </Question>
              ) : null}

              {status === "ready" && !isMatching && step === "avoid" ? (
                <Question
                  key="avoid"
                  title="What should it avoid?"
                  subtitle="Choose notes they would rather not wear."
                  onSkip={skipCurrentStep}
                >
                  <NotePicker
                    quickPicks={quickPicks}
                    categories={ingredientCategories}
                    isArabic={isArabic}
                    selected={avoided}
                    disabled={(value) =>
                      selectedLoved.has(normalizeFinderTerm(value))
                    }
                    onToggle={(value) =>
                      setAvoided((values) => toggleValue(values, value))
                    }
                  />
                </Question>
              ) : null}

              {status === "ready" && !isMatching && step === "season" ? (
                <Question
                  key="season"
                  title="When should this fragrance perform best?"
                  subtitle="Choose one or more moments."
                  onSkip={skipCurrentStep}
                >
                  <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-5">
                    {seasonOptions.map((option, index) => (
                      <OptionButton
                        key={option.value}
                        delay={index * 45}
                        active={seasons.includes(option.value)}
                        onClick={() =>
                          setSeasons((values) => toggleValue(values, option.value))
                        }
                        compact
                      >
                        <span className="font-serif text-3xl leading-none text-[#7A6A4F]">
                          {option.icon}
                        </span>
                        <span className="label-caps">{option.label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </Question>
              ) : null}

              {status === "ready" && !isMatching && step === "presence" ? (
                <Question
                  key="presence"
                  title="How much presence should it leave behind?"
                  subtitle="Choose as many as feel right."
                  onSkip={skipCurrentStep}
                >
                  <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
                    {presenceOptions.map((option, index) => (
                      <OptionButton
                        key={option.value}
                        delay={index * 55}
                        active={presences.includes(option.value)}
                        onClick={() =>
                          setPresences((values) => toggleValue(values, option.value))
                        }
                      >
                        <span className="font-serif text-4xl leading-none text-[#7A6A4F]">
                          {option.icon}
                        </span>
                        <span className="label-caps">{option.label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </Question>
              ) : null}

              {status === "ready" && !isMatching && step === "results" ? (
                <div className="animate-scent-step-in">
                  <div className="mx-auto mb-8 max-w-2xl text-center">
                    <p className="label-caps mb-4 text-[#7A6A4F]">
                      Your Selection
                    </p>
                    <h2 className="font-serif text-[clamp(2rem,5vw,3rem)] leading-tight">
                      Closest scent matches
                    </h2>
                  </div>

                  {results.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {results.slice(0, 6).map((fragrance, index) => {
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
                          <a
                            key={fragrance.id}
                            href={`/${locale}/fragrances/${fragrance.slug}`}
                            onClick={(event) =>
                              handleResultClick(event, fragrance, imageAlt)
                            }
                            className="animate-scent-option-in group border border-[#7A6A4F]/35 bg-white/45 p-3 transition-colors hover:border-[#D4AF37]"
                            style={{animationDelay: `${index * 70}ms`}}
                          >
                            <div
                              data-product-transition-source
                              className="relative aspect-[4/5] overflow-hidden bg-[#EAE4D8]"
                            >
                              <div className="absolute left-3 top-3 z-20 border border-[#D4AF37] bg-[#201B11] px-3 py-2 text-[#F9F6F0]">
                                <span className="label-caps">
                                  {fragrance.displayMatch}% Match
                                </span>
                              </div>
                              {fragrance.primaryImage ? (
                                <Image
                                  src={fragrance.primaryImage.url}
                                  alt={imageAlt}
                                  fill
                                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 90vw"
                                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                  unoptimized
                                  priority={index === 0}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center px-5 text-center font-serif text-3xl leading-tight text-[#201B11]/45">
                                  {name}
                                </div>
                              )}
                            </div>
                            <div className="px-2 pb-3 pt-5 text-center">
                              <p className="label-caps mb-2 text-[#7A6A4F]">
                                {formatEnum(fragrance.sillage)}
                              </p>
                              <h3 className="font-serif text-2xl leading-tight">
                                {name}
                              </h3>
                              <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#4B463E]">
                                {tagline}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mx-auto max-w-xl border border-[#7A6A4F]/40 p-8 text-center">
                      <h3 className="font-serif text-3xl">
                        No exact match found
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[#4B463E]">
                        Remove an avoided note or broaden the season to All Year.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#7A6A4F]/30 bg-[#F9F6F0] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={step === "results" ? resetFinder : previousStep}
                className={`label-caps min-h-11 border border-[#201B11] px-5 transition-colors hover:bg-[#EAE4D8] ${
                  currentStepIndex === 0 && !isMatching ? "invisible" : ""
                }`}
              >
                {step === "results" ? "Start Over" : isMatching ? "Cancel" : "Back"}
              </button>
              {!isMatching && step !== "results" ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canContinue || status !== "ready"}
                  className="label-caps min-h-11 border border-[#201B11] bg-[#201B11] px-7 text-[#F9F6F0] transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {step === "presence" ? "Discover" : "Next"}
                </button>
              ) : isMatching ? (
                <span className="label-caps text-[#7A6A4F]">Matching your selection...</span>
              ) : (
                <a
                  href={`/${locale}/fragrances`}
                  className="label-caps inline-flex min-h-11 items-center border border-[#201B11] bg-[#201B11] px-7 text-[#F9F6F0] transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37]"
                >
                  Browse All
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ScentMatchingStage({stage}: {stage: number}) {
  const messages = [
    {
      eyebrow: "Reading your preferences",
      title: "Gathering the notes they love"
    },
    {
      eyebrow: "Refining the match",
      title: "Balancing season and presence"
    },
    {
      eyebrow: "Almost there",
      title: "Finding the closest scent match"
    }
  ];
  const message = messages[stage] ?? messages[0];

  return (
    <div
      className="animate-scent-step-in flex min-h-[360px] flex-col items-center justify-center text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-10 grid h-32 w-32 place-items-center" aria-hidden="true">
        <span className="animate-scent-match-ring absolute inset-0 rounded-full border border-[#D4AF37]/55" />
        <span className="animate-scent-match-ring absolute inset-4 rounded-full border border-[#7A6A4F]/45 [animation-delay:-1.4s]" />
        <span className="animate-scent-match-pulse grid h-12 w-12 place-items-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 font-serif text-2xl text-[#7A6A4F]">
          V
        </span>
      </div>
      <p className="label-caps mb-4 text-[#7A6A4F]">{message.eyebrow}</p>
      <h2 className="max-w-2xl font-serif text-[clamp(2rem,5vw,3rem)] leading-tight">
        {message.title}
      </h2>
      <div className="mt-8 flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              index <= stage ? "bg-[#D4AF37]" : "bg-[#7A6A4F]/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Question({
  title,
  subtitle,
  onSkip,
  children
}: {
  title: string;
  subtitle?: string;
  onSkip?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-scent-step-in flex min-h-[360px] flex-col items-center justify-center text-center">
      <h2 className="mb-3 max-w-3xl font-serif text-[clamp(2rem,4vw,2.75rem)] leading-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="mb-7 text-sm leading-6 text-[#4B463E]">{subtitle}</p>
      ) : (
        <div className="mb-7" />
      )}
      {children}
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          className="focus-gold mt-8 text-sm text-[#7A6A4F] underline decoration-[#7A6A4F]/45 underline-offset-4 transition-colors hover:text-[#201B11]"
        >
          Skip this step
        </button>
      ) : null}
    </div>
  );
}

function NotePicker({
  quickPicks,
  categories,
  isArabic,
  selected,
  disabled,
  onToggle
}: {
  quickPicks: FinderIngredient[];
  categories: IngredientCategoryGroup[];
  isArabic: boolean;
  selected: string[];
  disabled?: (value: string) => boolean;
  onToggle: (value: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(
    categories[0]?.category ?? null
  );
  const totalNotes = categories.reduce(
    (sum, category) => sum + category.ingredients.length,
    0
  );

  function isSelected(note: FinderIngredient) {
    return selected.some((value) => normalizeFinderTerm(value) === note.key);
  }

  function noteButtonClass(note: FinderIngredient, compact = false) {
    const isDisabled = disabled?.(note.name) ?? false;
    const active = isSelected(note);

    return `${compact ? "min-h-10 px-3 py-2" : "min-h-32 px-3 py-4"} focus-gold group relative border transition-all duration-300 ${
      active
        ? "border-[#D4AF37] bg-[#201B11] text-[#F9F6F0] shadow-[0_0_18px_rgba(212,175,55,0.18)]"
        : "border-[#7A6A4F]/35 bg-white/35 text-[#201B11] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
    } ${isDisabled ? "cursor-not-allowed border-[#CDC5BB] text-[#8B8375] opacity-50" : ""}`;
  }

  return (
    <div className="w-full max-w-3xl text-left">
      <div className="mb-4 flex items-center gap-3 text-[#7A6A4F]">
        <span aria-hidden="true" className="h-px w-7 bg-[#7A6A4F]/55" />
        <span className="label-caps">Quick Picks</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {quickPicks.map((note, index) => {
          const unavailable = disabled?.(note.name) ?? false;
          const noteImage = ingredientFinderImage(note.name);

          return (
            <button
              key={note.key}
              type="button"
              aria-pressed={isSelected(note)}
              disabled={unavailable}
              onClick={() => onToggle(note.name)}
              style={{animationDelay: `${index * 40}ms`}}
              className={`animate-scent-option-in ${noteButtonClass(note)}`}
            >
              <span
                aria-hidden="true"
                className={`absolute right-3 top-3 h-4 w-4 rounded-full border ${
                  isSelected(note)
                    ? "border-[#D4AF37] bg-[#D4AF37]"
                    : "border-[#7A6A4F]/35 bg-[#F9F6F0]"
                }`}
              />
              {noteImage ? (
                <Image
                  src={noteImage}
                  alt=""
                  width={64}
                  height={64}
                  className="mx-auto mb-3 h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border font-serif text-3xl leading-none ${
                    isSelected(note) ? "text-[#D4AF37]" : "text-[#7A6A4F]"
                  } ${isSelected(note) ? "border-[#D4AF37]/65" : "border-[#7A6A4F]/30"}`}
                >
                  {ingredientFinderIcon(note.name, note.category)}
                </span>
              )}
              <span className="label-caps block pr-4 leading-5">{note.name}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-expanded={showAll}
        onClick={() => setShowAll((current) => !current)}
        className="focus-gold group mt-5 flex min-h-20 w-full items-center justify-between gap-4 border border-[#7A6A4F]/25 bg-[#EAE4D8]/55 px-4 py-4 text-left transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#EAE4D8]/80 sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-4">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#7A6A4F] text-xl leading-none text-[#F9F6F0] transition-colors duration-300 group-hover:bg-[#201B11]">
            {showAll ? "−" : "+"}
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-[1.35rem] leading-6">
              {showAll ? "Hide note catalog" : `See all (${totalNotes})`}
            </span>
            <span className="mt-1.5 block text-xs leading-4 text-[#7A6A4F]">
              Browse notes by scent family
            </span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#7A6A4F]/25 text-lg text-[#7A6A4F] transition-all duration-500 group-hover:border-[#D4AF37] ${
            showAll ? "rotate-180" : "rotate-0"
          }`}
        >
          ⌄
        </span>
      </button>

      <div
        aria-hidden={!showAll}
        inert={!showAll}
        className={`grid transition-[grid-template-rows,opacity,margin-top] duration-500 ease-out motion-reduce:transition-none ${
          showAll
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2">
          {categories.map(({category, ingredients}) => {
            const isOpen = openCategory === category;
            const categoryId = `finder-category-${category.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            const categoryImage = ingredients
              .map((ingredient) => ingredientFinderImage(ingredient.name))
              .find((image): image is string => Boolean(image));

            return (
              <section key={category} className="overflow-hidden border border-[#7A6A4F]/20 bg-white/35">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={categoryId}
                  onClick={() => setOpenCategory((current) => (current === category ? null : category))}
                  className="focus-gold flex min-h-15 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#EAE4D8]/65"
                >
                  <span className="flex items-center gap-3">
                    {categoryImage ? (
                      <Image
                        src={categoryImage}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full border border-[#7A6A4F]/25 font-serif text-2xl leading-none text-[#7A6A4F]">
                        {ingredientCategoryIcon(category)}
                      </span>
                    )}
                    <span>
                      <span className="block font-serif text-xl leading-5">
                        {ingredientCategoryLabel(category, isArabic)}
                      </span>
                      <span className="mt-1 block text-xs text-[#7A6A4F]">
                        {ingredients.length} {ingredients.length === 1 ? "note" : "notes"}
                      </span>
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xl text-[#7A6A4F]">
                    {isOpen ? "⌃" : "⌄"}
                  </span>
                </button>
                <div
                  id={categoryId}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="flex flex-wrap gap-2 border-t border-[#7A6A4F]/15 p-3">
                      {ingredients.map((note) => {
                        const unavailable = disabled?.(note.name) ?? false;
                        const noteImage = ingredientFinderImage(note.name);

                        return (
                          <button
                            key={note.key}
                            type="button"
                            aria-pressed={isSelected(note)}
                            disabled={unavailable}
                            onClick={() => onToggle(note.name)}
                            className={noteButtonClass(note, true)}
                          >
                            {noteImage ? (
                              <Image
                                src={noteImage}
                                alt=""
                                width={28}
                                height={28}
                                className="mr-2 h-7 w-7 shrink-0 object-contain"
                              />
                            ) : (
                              <span aria-hidden="true" className="mr-2 font-serif text-base text-[#7A6A4F]">
                                {ingredientFinderIcon(note.name, note.category)}
                              </span>
                            )}
                            {note.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionButton({
  active,
  compact = false,
  delay = 0,
  children,
  onClick
}: {
  active: boolean;
  compact?: boolean;
  delay?: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{animationDelay: `${delay}ms`}}
      className={`animate-scent-option-in group flex items-center justify-center gap-4 border p-6 transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 ${
        compact ? "min-h-24" : "min-h-40 flex-col"
      } ${
        active
          ? "border-[#D4AF37] bg-[#D4AF37]/12 shadow-[0_0_18px_rgba(212,175,55,0.18)]"
          : "border-[#7A6A4F]/40 bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function PillGrid({
  options,
  selected,
  disabled,
  onToggle
}: {
  options: string[];
  selected: string[];
  disabled?: (value: string) => boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((option, index) => {
        const isDisabled = disabled?.(option) ?? false;
        const isSelected = selected.some(
          (value) =>
            normalizeFinderTerm(value) === normalizeFinderTerm(option)
        );

        return (
          <button
            key={option}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggle(option)}
            style={{animationDelay: `${index * 28}ms`}}
            className={`animate-scent-option-in label-caps min-h-14 border px-3 transition-colors ${
              isSelected
                ? "border-[#D4AF37] bg-[#201B11] text-[#F9F6F0]"
                : "border-[#7A6A4F]/40 text-[#201B11] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
            } disabled:cursor-not-allowed disabled:border-[#CDC5BB] disabled:text-[#8B8375] disabled:opacity-50`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
