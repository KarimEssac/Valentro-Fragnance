export const defaultIngredientCategories = [
  "Citrus & Fresh",
  "Fruits",
  "Sweet & Gourmand",
  "Herbal & Floral",
  "Woody & Earthy",
  "Spicy & Aromatic",
  "Base & Accent Notes"
] as const;

const categoryIcons: Record<string, string> = {
  "Citrus & Fresh": "◉",
  Fruits: "◌",
  "Sweet & Gourmand": "✦",
  "Herbal & Floral": "✿",
  "Woody & Earthy": "♧",
  "Spicy & Aromatic": "✧",
  "Base & Accent Notes": "◇"
};

const categoryLabelsAr: Record<string, string> = {
  "Citrus & Fresh": "حمضيات ومنعش",
  Fruits: "فواكه",
  "Sweet & Gourmand": "حلو وغورماند",
  "Herbal & Floral": "عشبي وزهري",
  "Woody & Earthy": "خشبي وترابي",
  "Spicy & Aromatic": "حار وعطري",
  "Base & Accent Notes": "نوتات القاعدة واللمسات"
};

const categoryKeywords: Array<{category: string; keywords: string[]}> = [
  {
    category: "Citrus & Fresh",
    keywords: [
      "bergamot",
      "citron",
      "grapefruit",
      "lemon",
      "orange",
      "mandarin",
      "tangerine",
      "lime",
      "marine",
      "water",
      "ozonic",
      "green notes",
      "beach"
    ]
  },
  {
    category: "Fruits",
    keywords: [
      "apple",
      "pear",
      "peach",
      "plum",
      "berry",
      "fig",
      "melon",
      "mango",
      "pineapple",
      "cherry",
      "blackcurrant"
    ]
  },
  {
    category: "Sweet & Gourmand",
    keywords: [
      "vanilla",
      "caramel",
      "chocolate",
      "coffee",
      "honey",
      "tonka",
      "praline",
      "coconut",
      "almond",
      "sugar",
      "cacao",
      "milk"
    ]
  },
  {
    category: "Herbal & Floral",
    keywords: [
      "jasmine",
      "rose",
      "lavender",
      "iris",
      "neroli",
      "violet",
      "tuberose",
      "gardenia",
      "lily",
      "peony",
      "geranium",
      "tea",
      "mint",
      "sage",
      "basil",
      "herbal",
      "floral"
    ]
  },
  {
    category: "Woody & Earthy",
    keywords: [
      "oud",
      "wood",
      "cedar",
      "sandalwood",
      "vetiver",
      "patchouli",
      "oakmoss",
      "cypress",
      "cashmeran",
      "earth"
    ]
  },
  {
    category: "Spicy & Aromatic",
    keywords: [
      "saffron",
      "pepper",
      "cardamom",
      "cinnamon",
      "clove",
      "ginger",
      "nutmeg",
      "spice",
      "anise"
    ]
  },
  {
    category: "Base & Accent Notes",
    keywords: [
      "amber",
      "musk",
      "labdanum",
      "benzoin",
      "incense",
      "leather",
      "tobacco",
      "ambroxan",
      "iso e",
      "resin"
    ]
  }
];

const ingredientFinderImages: Array<{keywords: string[]; src: string}> = [
  {keywords: ["bergamot"], src: "/images/ingredients/bergamot.png"},
  {keywords: ["madagascar vanilla", "vanilla"], src: "/images/ingredients/madagascar-vanilla.png"},
  {keywords: ["jasmine"], src: "/images/ingredients/jasmine.png"},
  {keywords: ["laotian oud", "oud"], src: "/images/ingredients/laotian-oud.png"},
  {keywords: ["saffron"], src: "/images/ingredients/saffron.png"},
  {keywords: ["labdanum"], src: "/images/ingredients/labdanum.png"},
  {keywords: ["amber woods"], src: "/images/ingredients/amber-woods.png"},
  {keywords: ["mandarin"], src: "/images/ingredients/mandarin.png"},
  {keywords: ["clean musk", "musk"], src: "/images/ingredients/clean-musk.png"}
];

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeIngredientCategory(value: unknown) {
  if (typeof value !== "string") return null;
  const category = clean(value);
  if (!category || category.length > 80) return null;

  return (
    defaultIngredientCategories.find(
      (candidate) => candidate.toLocaleLowerCase() === category.toLocaleLowerCase()
    ) ?? category
  );
}

export function inferIngredientCategory(name: string) {
  const normalizedName = clean(name).toLocaleLowerCase();
  const matched = categoryKeywords.find(({keywords}) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  );

  return matched?.category ?? "Base & Accent Notes";
}

export function ingredientCategoryFor(name: string, category?: string | null) {
  return normalizeIngredientCategory(category) ?? inferIngredientCategory(name);
}

export function ingredientCategoryIcon(category: string) {
  return categoryIcons[category] ?? "✦";
}

export function ingredientCategoryLabel(category: string, isArabic = false) {
  return isArabic ? categoryLabelsAr[category] ?? category : category;
}

export function ingredientCategorySortOrder(category: string) {
  const index = defaultIngredientCategories.indexOf(
    category as (typeof defaultIngredientCategories)[number]
  );
  return index === -1 ? defaultIngredientCategories.length : index;
}

export function ingredientFinderImage(name: string) {
  const normalizedName = clean(name).toLocaleLowerCase();
  return (
    ingredientFinderImages.find(({keywords}) =>
      keywords.some((keyword) => normalizedName.includes(keyword))
    )?.src ?? null
  );
}

export function ingredientFinderIcon(name: string, category?: string | null) {
  const normalizedName = clean(name).toLocaleLowerCase();

  if (normalizedName.includes("vanilla")) return "✣";
  if (normalizedName.includes("musk")) return "◌";
  if (normalizedName.includes("bergamot") || normalizedName.includes("citrus")) return "◉";
  if (normalizedName.includes("jasmine") || normalizedName.includes("rose")) return "✿";
  if (normalizedName.includes("oud") || normalizedName.includes("wood")) return "♧";
  if (normalizedName.includes("saffron") || normalizedName.includes("spice")) return "✧";
  if (normalizedName.includes("amber") || normalizedName.includes("labdanum")) return "◇";

  return ingredientCategoryIcon(ingredientCategoryFor(name, category));
}
