"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import {useEffect, useMemo, useState} from "react";

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
  bestFor: string[];
  seasons: string[];
  sillage: string;
  ingredients: {
    nameEn: string;
    nameAr: string;
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

const audienceOptions = [
  {value: "HER", label: "For Her", icon: "♀"},
  {value: "HIM", label: "For Him", icon: "♂"},
  {value: "UNISEX", label: "Unisex", icon: "∞"}
];

const seasonOptions = [
  {value: "SPRING", label: "Spring"},
  {value: "SUMMER", label: "Summer"},
  {value: "FALL", label: "Fall"},
  {value: "WINTER", label: "Winter"},
  {value: "ALL_YEAR", label: "All Year"}
];

const presenceOptions = [
  {value: "MODERATE", label: "Moderate"},
  {value: "STRONG", label: "Strong"},
  {value: "ENORMOUS", label: "Enormous"}
];

const fallbackIngredients = [
  "Vanilla",
  "Amber",
  "Oud",
  "Musk",
  "Jasmine",
  "Citrus",
  "Bergamot",
  "Saffron",
  "Woods",
  "Powder"
];

const steps: FinderStep[] = [
  "audience",
  "love",
  "avoid",
  "season",
  "presence",
  "results"
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

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

function presenceMatches(selectedPresence: string, sillage: string) {
  if (!selectedPresence) return 0;

  const groups: Record<string, string[]> = {
    MODERATE: ["SOFT_LANDING", "MODERATE", "NOTICEABLE"],
    STRONG: ["NOTICEABLE", "STRONG"],
    ENORMOUS: ["ENORMOUS", "FILLS_THE_ROOM", "STRONG"]
  };

  return groups[selectedPresence]?.includes(sillage) ? 18 : 0;
}

function seasonMatches(selectedSeason: string, fragrance: FinderFragrance) {
  if (!selectedSeason) return 0;
  if (selectedSeason === "ALL_YEAR") {
    return fragrance.seasons.includes("ALL_YEAR") ? 18 : 8;
  }
  if (
    fragrance.seasons.includes(selectedSeason) ||
    fragrance.seasons.includes("ALL_YEAR")
  ) {
    return 18;
  }

  const legacyBestFor = fragrance.bestFor.map(normalize);
  return legacyBestFor.some((item) => item.includes(normalize(selectedSeason)))
    ? 12
    : 0;
}

function scoreFragrance({
  fragrance,
  audience,
  loved,
  avoided,
  season,
  presence
}: {
  fragrance: FinderFragrance;
  audience: string;
  loved: string[];
  avoided: string[];
  season: string;
  presence: string;
}) {
  const ingredientNames = fragrance.ingredients.map((ingredient) =>
    normalize(ingredient.nameEn)
  );
  const searchableNotes = [
    ...ingredientNames,
    normalize(fragrance.scentProfile),
    ...fragrance.bestFor.map(normalize),
    ...fragrance.avoidIf.map(normalize)
  ];

  const hasAvoidedNote = avoided.some((note) => {
    const normalizedNote = normalize(note);
    return searchableNotes.some(
      (candidate) =>
        candidate.includes(normalizedNote) || normalizedNote.includes(candidate)
    );
  });

  if (hasAvoidedNote) return 0;

  let score = 0;

  if (audience) {
    if (fragrance.gender === audience) score += 24;
    else if (fragrance.gender === "UNISEX" || audience === "UNISEX") score += 14;
  }

  if (loved.length > 0) {
    const lovedMatches = loved.filter((note) => {
      const normalizedNote = normalize(note);
      return searchableNotes.some(
        (candidate) =>
          candidate.includes(normalizedNote) || normalizedNote.includes(candidate)
      );
    }).length;
    score += Math.min(32, lovedMatches * 16);
  }

  score += seasonMatches(season, fragrance);
  score += presenceMatches(presence, fragrance.sillage);

  if (loved.length === 0 && !season && !presence) score += 10;

  return Math.min(100, Math.max(0, score));
}

export default function ScentFinder() {
  const locale = useLocale();
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
  const [season, setSeason] = useState("");
  const [presence, setPresence] = useState("");

  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const canContinue =
    step === "audience"
      ? Boolean(audience)
      : step === "love"
        ? loved.length > 0
        : step === "season"
          ? Boolean(season)
          : step === "presence"
            ? Boolean(presence)
            : true;

  const ingredientOptions = useMemo(() => {
    const names = fragrances.flatMap((fragrance) =>
      fragrance.ingredients.map((ingredient) =>
        isArabic ? ingredient.nameAr : ingredient.nameEn
      )
    );
    const scentProfiles = fragrances.map((fragrance) =>
      formatEnum(fragrance.scentProfile)
    );

    return Array.from(new Set([...names, ...scentProfiles, ...fallbackIngredients]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 18);
  }, [fragrances, isArabic]);

  const results = useMemo<ScoredFragrance[]>(() => {
    const scored = fragrances
      .map((fragrance) => ({
        ...fragrance,
        match: scoreFragrance({
          fragrance,
          audience,
          loved,
          avoided,
          season,
          presence
        }),
        displayMatch: 0
      }))
      .filter((fragrance) => fragrance.match > 0)
      .sort((a, b) => b.match - a.match);

    return scored.map((fragrance, index) => ({
      ...fragrance,
      displayMatch: index === 0 ? Math.max(70, fragrance.match) : fragrance.match
    }));
  }, [audience, avoided, fragrances, loved, presence, season]);

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

  function openFinder() {
    if (status === "idle") setStatus("loading");
    setIsOpen(true);
  }

  function closeFinder() {
    setIsOpen(false);
  }

  function nextStep() {
    if (step === "results") return;
    const next = steps[currentStepIndex + 1] ?? "results";
    setStep(next);
  }

  function previousStep() {
    if (currentStepIndex <= 0) return;
    setStep(steps[currentStepIndex - 1]);
  }

  function resetFinder() {
    setStep("audience");
    setAudience("");
    setLoved([]);
    setAvoided([]);
    setSeason("");
    setPresence("");
  }

  const selectedLoved = new Set(loved.map(normalize));

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
                {step === "results"
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

              {status === "ready" && step === "audience" ? (
                <Question key="audience" title="For whom is this selection?">
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

              {status === "ready" && step === "love" ? (
                <Question key="love" title="What do they love?">
                  <PillGrid
                    options={ingredientOptions}
                    selected={loved}
                    onToggle={(value) => {
                      setLoved((values) => toggleValue(values, value));
                      setAvoided((values) =>
                        values.filter((item) => normalize(item) !== normalize(value))
                      );
                    }}
                  />
                </Question>
              ) : null}

              {status === "ready" && step === "avoid" ? (
                <Question key="avoid" title="What should it avoid?">
                  <PillGrid
                    options={ingredientOptions}
                    selected={avoided}
                    disabled={(value) => selectedLoved.has(normalize(value))}
                    onToggle={(value) =>
                      setAvoided((values) => toggleValue(values, value))
                    }
                  />
                </Question>
              ) : null}

              {status === "ready" && step === "season" ? (
                <Question key="season" title="When should this fragrance perform best?">
                  <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-5">
                    {seasonOptions.map((option, index) => (
                      <OptionButton
                        key={option.value}
                        delay={index * 45}
                        active={season === option.value}
                        onClick={() => setSeason(option.value)}
                        compact
                      >
                        <span className="label-caps">{option.label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </Question>
              ) : null}

              {status === "ready" && step === "presence" ? (
                <Question key="presence" title="How much presence should it leave behind?">
                  <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                    {presenceOptions.map((option, index) => (
                      <OptionButton
                        key={option.value}
                        delay={index * 55}
                        active={presence === option.value}
                        onClick={() => setPresence(option.value)}
                      >
                        <span className="label-caps">{option.label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </Question>
              ) : null}

              {status === "ready" && step === "results" ? (
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
                            className="animate-scent-option-in group border border-[#7A6A4F]/35 bg-white/45 p-3 transition-colors hover:border-[#D4AF37]"
                            style={{animationDelay: `${index * 70}ms`}}
                          >
                            <div className="relative aspect-[4/5] overflow-hidden bg-[#EAE4D8]">
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
                  currentStepIndex === 0 ? "invisible" : ""
                }`}
              >
                {step === "results" ? "Start Over" : "Back"}
              </button>
              {step !== "results" ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canContinue || status !== "ready"}
                  className="label-caps min-h-11 border border-[#201B11] bg-[#201B11] px-7 text-[#F9F6F0] transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {step === "presence" ? "Discover" : "Next"}
                </button>
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

function Question({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-scent-step-in flex min-h-[360px] flex-col items-center justify-center text-center">
      <h2 className="mb-10 max-w-3xl font-serif text-[clamp(2rem,5vw,3rem)] leading-tight">
        {title}
      </h2>
      {children}
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
          (value) => normalize(value) === normalize(option)
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
