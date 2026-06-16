"use client";

import Image from "next/image";
import {useRouter} from "next/navigation";
import {useMemo, useState} from "react";

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
  totalStock: number;
  minPrice: string | null;
  maxPrice: string | null;
  primaryImage: {url: string; altEn: string; altAr: string} | null;
  collections: string[];
  variants: {id: string; sku: string; sizeML: number; price: string; stock: number}[];
  ingredients: {nameEn: string; note: string}[];
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
const ingredientOptions = [
  "Agarwood",
  "Amber",
  "Ambergris",
  "Apple",
  "Basil",
  "Bergamot",
  "Black Pepper",
  "Cardamom",
  "Cedarwood",
  "Cinnamon",
  "Clean Musk",
  "Coconut",
  "Coffee",
  "Damask Rose",
  "Frankincense",
  "Geranium",
  "Grapefruit",
  "Incense",
  "Iris",
  "Jasmine",
  "Labdanum",
  "Lavender",
  "Leather",
  "Lemon",
  "Mandarin",
  "Madagascar Vanilla",
  "Musk",
  "Myrrh",
  "Neroli",
  "Orange Blossom",
  "Oud",
  "Patchouli",
  "Pear",
  "Pink Pepper",
  "Rose",
  "Saffron",
  "Sandalwood",
  "Tonka Bean",
  "Tuberose",
  "Vanilla",
  "Vetiver",
  "Violet",
  "White Flowers",
  "Woods",
  "Ylang Ylang"
];

type VariantDraft = {
  id?: string;
  sizeML: string;
  price: string;
  stock: string;
};

function formatEnum(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
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

export default function AdminInventoryClient({locale, products}: Props) {
  const router = useRouter();
  const isArabic = locale === "ar";
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState<InventoryProduct | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedAvoidIf, setSelectedAvoidIf] = useState<string[]>([]);
  const [createVariants, setCreateVariants] = useState<VariantDraft[]>([
    {sizeML: "50", price: "", stock: "0"}
  ]);
  const currency = useMemo(() => new Intl.NumberFormat(locale, {style: "currency", currency: "EGP", maximumFractionDigits: 0}), [locale]);

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

  const totalStock = products.reduce((sum, product) => sum + product.totalStock, 0);
  const lowStockCount = products.filter((product) => product.totalStock <= 5).length;
  const featuredCount = products.filter((product) => product.isFeatured).length;
  const collectionCount = new Set(products.flatMap((product) => product.collections)).size;

  function openAddProduct() {
    setSelectedSeasons([]);
    setSelectedIngredients([]);
    setSelectedAvoidIf([]);
    setCreateVariants([{sizeML: "50", price: "", stock: "0"}]);
    setStatus("");
    setAddOpen(true);
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
    selectedIngredients.forEach((ingredient) => form.append("ingredients", ingredient));
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
      <header className="sticky top-16 z-20 -mx-gutter mb-10 border-b border-outline/60 bg-surface-hi/95 px-gutter py-5 backdrop-blur-sm lg:top-0 lg:-mx-16 lg:px-16">
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

      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Stock", totalStock],
          ["Low Stock Items", lowStockCount],
          ["Featured Products", featuredCount],
          ["Collections", collectionCount]
        ].map(([label, value]) => (
          <div key={label} className="border border-outline/55 bg-surface/70 p-6">
            <p className="label-caps mb-4 text-on-surface/70">{label}</p>
            <p className="font-serif text-4xl text-parchment">{value}</p>
          </div>
        ))}
      </section>

      <section className="border border-outline/55 bg-surface/70">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline/60">
                {["Image", "Fragrance Name", "Collection", "Stock Level", "Price", "Actions"].map((head) => (
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
                    <td className="p-5 text-right">
                      <button type="button" onClick={() => setDetails(product)} className="label-caps border-b border-transparent pb-1 text-gold transition-colors hover:border-gold hover:text-parchment">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 ? <p className="px-6 py-10 text-center text-sm text-on-surface/70">No inventory matches the current search.</p> : null}
      </section>

      {details ? (
        <div className="fixed inset-0 z-[1000]">
          <button type="button" aria-label="Close product details" onClick={() => setDetails(null)} className="absolute inset-0 h-full w-full bg-parchment/35" />
          <aside className="absolute bottom-0 right-0 top-0 w-full max-w-2xl overflow-y-auto border-l border-outline bg-surface-hi p-8 shadow-[0_0_70px_rgba(74,47,22,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div><p className="label-caps mb-2 text-gold">Product Details</p><h2 className="font-serif text-4xl leading-tight">{isArabic ? details.nameAr : details.nameEn}</h2></div>
              <button type="button" onClick={() => setDetails(null)} className="text-2xl text-gold">x</button>
            </div>
            <EditProductForm
              product={details}
              onClose={() => setDetails(null)}
              onSaved={() => {
                setDetails(null);
                router.refresh();
              }}
            />
          </aside>
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
                <Field label="Gender"><select name="gender" className={inputClass()}>{genders.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></Field>
                <Field label="Scent Profile"><select name="scentProfile" className={inputClass()}>{scents.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></Field>
                <Field label="Sillage"><select name="sillage" className={inputClass()}>{sillages.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></Field>
                <Field label="Longevity Hours"><input name="longevity" type="number" min="1" defaultValue="8" required className={inputClass()} /></Field>
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
              <SearchableMultiSelect
                label="Ingredients"
                options={ingredientOptions.filter((option) => !selectedAvoidIf.includes(option))}
                selected={selectedIngredients}
                onChange={setSelectedIngredients}
              />
              <SearchableMultiSelect
                label="Avoid If"
                options={ingredientOptions.filter((option) => !selectedIngredients.includes(option))}
                selected={selectedAvoidIf}
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
  onClose,
  onSaved
}: {
  product: InventoryProduct;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(product.seasons);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    product.ingredients.map((ingredient) => ingredient.nameEn)
  );
  const [selectedAvoidIf, setSelectedAvoidIf] = useState<string[]>(product.avoidIf);
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
      ingredients: selectedIngredients,
      avoidIf: selectedAvoidIf,
      seasons: selectedSeasons,
      variants
    };

    try {
      const response = await fetch(`/api/admin/fragrances/${product.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to update product");
      onSaved();
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
        <Field label="Gender"><select name="gender" defaultValue={product.gender} className={inputClass()}>{genders.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></Field>
        <Field label="Scent Profile"><select name="scentProfile" defaultValue={product.scentProfile} className={inputClass()}>{scents.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></Field>
        <Field label="Sillage"><select name="sillage" defaultValue={product.sillage} className={inputClass()}>{sillages.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></Field>
        <Field label="Longevity Hours"><input name="longevity" type="number" min="1" defaultValue={product.longevity} required className={inputClass()} /></Field>
      </div>
      <Field label="English Description"><textarea name="descriptionEn" defaultValue={product.descriptionEn} required rows={3} className={inputClass()} /></Field>
      <Field label="Arabic Description (Optional)"><textarea name="descriptionAr" defaultValue={product.descriptionAr === product.descriptionEn ? "" : product.descriptionAr} rows={3} className={inputClass()} /></Field>
      <SearchableMultiSelect
        label="Ingredients"
        options={ingredientOptions.filter((option) => !selectedAvoidIf.includes(option))}
        selected={selectedIngredients}
        onChange={setSelectedIngredients}
      />
      <SearchableMultiSelect
        label="Avoid If"
        options={ingredientOptions.filter((option) => !selectedIngredients.includes(option))}
        selected={selectedAvoidIf}
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
  onChange
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = options
    .filter((option) => option.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  }

  return (
    <div>
      <p className="label-caps mb-2 text-gold">{label}</p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${label.toLowerCase()}`}
        className={inputClass()}
      />
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className="label-caps border border-gold px-3 py-1 text-gold"
            >
              {item} x
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`label-caps min-h-10 border px-3 text-left transition-colors ${
              selected.includes(option)
                ? "border-parchment bg-parchment text-surface-hi"
                : "border-outline text-parchment hover:border-gold hover:text-gold"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
