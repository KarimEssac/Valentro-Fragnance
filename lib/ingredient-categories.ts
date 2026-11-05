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

// Keep specific notes before shared family artwork so existing illustrations take priority.
const ingredientFinderImages: Array<{keywords: string[]; src: string}> = [
  {keywords: ["bergamot"], src: "/images/ingredients/bergamot.png"},
  {keywords: ["madagascar vanilla", "vanilla"], src: "/images/ingredients/madagascar-vanilla.png"},
  {keywords: ["jasmine"], src: "/images/ingredients/jasmine.png"},
  {keywords: ["laotian oud", "oud"], src: "/images/ingredients/laotian-oud.png"},
  {keywords: ["saffron"], src: "/images/ingredients/saffron.png"},
  {keywords: ["labdanum"], src: "/images/ingredients/labdanum.png"},
  {keywords: ["amber woods"], src: "/images/ingredients/amber-woods.png"},
  {keywords: ["mandarin"], src: "/images/ingredients/mandarin.png"},
  {keywords: ["clean musk", "musk"], src: "/images/ingredients/clean-musk.png"},
  {keywords: ["lavender", "lavandin"], src: "/images/ingredients/lavender.png"},
  {keywords: ["patchouli", "vetiver", "oakmoss", "truffle", "earth"], src: "/images/ingredients/patchouli-earth.png"},
  {keywords: ["green notes", "mint", "sage", "basil", "davana", "herbal", "tea"], src: "/images/ingredients/green-herbs.png"},
  {keywords: ["rose", "iris", "orris", "neroli", "violet", "gardenia", "lily", "peony", "geranium", "orange blossom", "orchid", "lotus", "mahonial", "ylang", "floral"], src: "/images/ingredients/floral-bouquet.png"},
  {keywords: ["apple", "pear", "peach", "plum", "berry", "berries", "currant", "fig", "melon", "mango", "pineapple", "cherry", "fruity", "fruit"], src: "/images/ingredients/fruits.png"},
  {keywords: ["pepper", "cardamom", "cinnamon", "clove", "ginger", "nutmeg", "spice", "anise", "caraway", "licorice"], src: "/images/ingredients/warm-spices.png"},
  {keywords: ["almond", "tonka", "chestnut", "praline", "coumarin"], src: "/images/ingredients/nuts-tonka.png"},
  {keywords: ["coffee", "cacao", "chocolate"], src: "/images/ingredients/coffee-cacao.png"},
  {keywords: ["caramel", "honey", "sugar"], src: "/images/ingredients/sugar-honey.png"},
  {keywords: ["marine", "water", "ozonic", "beach", "salt"], src: "/images/ingredients/marine-salt.png"},
  {keywords: ["tobacco"], src: "/images/ingredients/tobacco.png"},
  {keywords: ["cognac", "liquor", "rum"], src: "/images/ingredients/spirits.png"},
  {keywords: ["benzoin", "elemi", "incense", "resin", "ambroxan", "iso e", "leather"], src: "/images/ingredients/base-accents.png"},
  {keywords: ["amber", "wood", "cedar", "sandalwood", "cypress", "cashmeran", "oak"], src: "/images/ingredients/amber-woods.png"},
  {keywords: ["orange", "tangerine"], src: "/images/ingredients/mandarin.png"},
  {keywords: ["citron", "grapefruit", "lemon", "lime", "yuzu", "citrus"], src: "/images/ingredients/bergamot.png"}
];

const ingredientCategoryImages: Record<string, string> = {
  "Citrus & Fresh": "/images/ingredients/bergamot.png",
  Fruits: "/images/ingredients/fruits.png",
  "Sweet & Gourmand": "/images/ingredients/madagascar-vanilla.png",
  "Herbal & Floral": "/images/ingredients/floral-bouquet.png",
  "Woody & Earthy": "/images/ingredients/amber-woods.png",
  "Spicy & Aromatic": "/images/ingredients/warm-spices.png",
  "Base & Accent Notes": "/images/ingredients/base-accents.png",
  "Top Notes": "/images/ingredients/bergamot.png",
  "Middle Notes": "/images/ingredients/jasmine.png",
  "Base Notes": "/images/ingredients/base-accents.png"
};

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

export function ingredientCategoryImage(category: string) {
  return ingredientCategoryImages[category] ?? ingredientCategoryImages["Base & Accent Notes"];
}

export function ingredientFinderImage(name: string, category?: string | null) {
  const normalizedName = clean(name).toLocaleLowerCase();
  return (
    ingredientFinderImages.find(({keywords}) =>
      keywords.some((keyword) => normalizedName.includes(keyword))
    )?.src ?? ingredientCategoryImage(ingredientCategoryFor(name, category))
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
