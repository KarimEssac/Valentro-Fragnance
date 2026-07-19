import {parseFinderRule} from "@/lib/finder-rules";

export type FinderScoringFragrance = {
  gender: string;
  scentProfile: string;
  avoidIf: string[];
  seasons: string[];
  sillage: string;
  ingredients: {
    nameEn: string;
    nameAr: string;
  }[];
};

export type FinderPreferences = {
  audience: string;
  loved: string[];
  avoided: string[];
  seasons: string[];
  presences: string[];
};

export type FinderAliasMap = Map<string, string[]>;

const sillageScale: Record<string, number> = {
  SOFT_LANDING: 0,
  MODERATE: 1,
  NOTICEABLE: 2,
  STRONG: 3,
  ENORMOUS: 4,
  FILLS_THE_ROOM: 5
};

const seasonCompatibility: Record<string, Partial<Record<string, number>>> = {
  SPRING: {SUMMER: 0.45, FALL: 0.2},
  SUMMER: {SPRING: 0.45},
  FALL: {WINTER: 0.55, SPRING: 0.2},
  WINTER: {FALL: 0.55}
};

export function normalizeFinderTerm(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/_/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueFinderTerms(values: string[]) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter((value) => {
      const key = normalizeFinderTerm(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

export function finderRuleIngredients(values: string[]) {
  return values.flatMap((value) => {
    const rule = parseFinderRule(value);
    return rule ? [rule.ingredient] : [];
  });
}

export function buildFinderAliasMap(fragrances: FinderScoringFragrance[]) {
  const aliases: FinderAliasMap = new Map();

  fragrances.forEach((fragrance) => {
    fragrance.ingredients.forEach((ingredient) => {
      const group = Array.from(
        new Set(
          [ingredient.nameEn, ingredient.nameAr]
            .map(normalizeFinderTerm)
            .filter(Boolean)
        )
      );

      group.forEach((alias) => {
        const merged = new Set([...(aliases.get(alias) ?? []), ...group]);
        aliases.set(alias, [...merged]);
      });
    });
  });

  return aliases;
}

function plainTermSimilarity(first: string, second: string) {
  if (!first || !second) return 0;
  if (first === second) return 1;

  const firstWords = new Set(first.split(" ").filter(Boolean));
  const secondWords = new Set(second.split(" ").filter(Boolean));
  const smaller = firstWords.size <= secondWords.size ? firstWords : secondWords;
  const larger = smaller === firstWords ? secondWords : firstWords;
  const isSubset = [...smaller].every((word) => larger.has(word));

  if (!isSubset) return 0;
  if (smaller.size === 1) {
    const word = [...smaller][0];
    return word.length >= 3 ? 0.88 : 0;
  }

  return 0.8;
}

function termSimilarity(first: string, second: string, aliases: FinderAliasMap) {
  const normalizedFirst = normalizeFinderTerm(first);
  const normalizedSecond = normalizeFinderTerm(second);
  if (!normalizedFirst || !normalizedSecond) return 0;

  const firstAliases = aliases.get(normalizedFirst) ?? [normalizedFirst];
  const secondAliases = aliases.get(normalizedSecond) ?? [normalizedSecond];

  return Math.max(
    ...firstAliases.flatMap((firstAlias) =>
      secondAliases.map((secondAlias) =>
        plainTermSimilarity(firstAlias, secondAlias)
      )
    )
  );
}

function audienceFit(selectedAudience: string, productGender: string) {
  if (!selectedAudience) return 0;
  if (selectedAudience === productGender) return 1;
  if (productGender === "UNISEX") return 0.9;
  if (selectedAudience === "UNISEX") return 0.68;
  return 0.15;
}

function singleSeasonFit(selectedSeason: string, productSeasons: string[]) {
  if (!selectedSeason) return 0;
  if (productSeasons.length === 0) return 0.35;
  if (productSeasons.includes("ALL_YEAR")) return 1;

  if (selectedSeason === "ALL_YEAR") {
    if (productSeasons.length >= 3) return 0.8;
    if (productSeasons.length === 2) return 0.65;
    return 0.45;
  }

  if (productSeasons.includes(selectedSeason)) return 1;

  return Math.max(
    0.1,
    ...productSeasons.map(
      (season) => seasonCompatibility[selectedSeason]?.[season] ?? 0.1
    )
  );
}

function seasonFit(selectedSeasons: string[], productSeasons: string[]) {
  if (selectedSeasons.length === 0) return 0;
  return Math.max(
    ...selectedSeasons.map((season) =>
      singleSeasonFit(season, productSeasons)
    )
  );
}

function presenceFit(selectedPresences: string[], productSillage: string) {
  const actual = sillageScale[productSillage];
  if (selectedPresences.length === 0 || actual === undefined) return 0;

  const desiredStrength: Record<string, number> = {
    SOFT_LANDING: 0,
    MODERATE: 1.5,
    NOTICEABLE: 2,
    STRONG: 3,
    ENORMOUS: 4,
    FILLS_THE_ROOM: 5
  };

  const fits = selectedPresences.flatMap((presence) => {
      const selected = desiredStrength[presence];
      return selected === undefined
        ? []
        : [Math.max(0.1, 1 - Math.abs(selected - actual) * 0.27)];
    });

  return fits.length > 0 ? Math.max(...fits) : 0;
}

function loveFit(
  loved: string[],
  fragrance: FinderScoringFragrance,
  aliases: FinderAliasMap
) {
  if (loved.length === 0) return 0;

  const ingredients = fragrance.ingredients.flatMap((ingredient) => [
    ingredient.nameEn,
    ingredient.nameAr
  ]);

  const scores = loved.map((selectedTerm) => {
    return Math.max(
      0,
      ...ingredients.map((ingredient) =>
        termSimilarity(selectedTerm, ingredient, aliases)
      )
    );
  });

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function conflictsWithAvoidedTerm(
  avoided: string[],
  fragrance: FinderScoringFragrance,
  aliases: FinderAliasMap
) {
  if (avoided.length === 0) return false;

  const productTerms = [
    fragrance.scentProfile.replace(/_/g, " "),
    ...fragrance.ingredients.flatMap((ingredient) => [
      ingredient.nameEn,
      ingredient.nameAr
    ]),
    ...finderRuleIngredients(fragrance.avoidIf)
  ];

  return avoided.some((selectedTerm) =>
    productTerms.some(
      (productTerm) => termSimilarity(selectedTerm, productTerm, aliases) >= 0.8
    )
  );
}

export function scoreFragranceMatch(
  fragrance: FinderScoringFragrance,
  preferences: FinderPreferences,
  aliases: FinderAliasMap
) {
  if (conflictsWithAvoidedTerm(preferences.avoided, fragrance, aliases)) {
    return 0;
  }

  const criteria = [
    {
      active: Boolean(preferences.audience),
      weight: 20,
      fit: audienceFit(preferences.audience, fragrance.gender)
    },
    {
      active: preferences.loved.length > 0,
      weight: 45,
      fit: loveFit(preferences.loved, fragrance, aliases)
    },
    {
      active: preferences.seasons.length > 0,
      weight: 18,
      fit: seasonFit(preferences.seasons, fragrance.seasons)
    },
    {
      active: preferences.presences.length > 0,
      weight: 17,
      fit: presenceFit(preferences.presences, fragrance.sillage)
    }
  ].filter((criterion) => criterion.active);

  const totalWeight = criteria.reduce(
    (total, criterion) => total + criterion.weight,
    0
  );
  if (totalWeight === 0) return 0;

  const weightedScore = criteria.reduce(
    (total, criterion) => total + criterion.fit * criterion.weight,
    0
  );

  return Math.max(1, Math.min(100, Math.round((weightedScore / totalWeight) * 100)));
}
