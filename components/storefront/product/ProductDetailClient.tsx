"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type {FormEvent, ReactNode} from "react";
import {useEffect, useMemo, useRef, useState} from "react";

import Modal from "@/components/ui/Modal";
import type {CartItem} from "@/lib/cart-items";
import {productDiscountBadge} from "@/lib/product-discounts";
import type {ActiveProductDiscount} from "@/lib/product-discounts";
import {
  getPendingProductTransition,
  getProductTransitionName
} from "@/lib/product-image-transition";
import type {StorefrontFragranceDetail as ProductDetail} from "@/lib/storefront-data";

type SessionResponse = {
  user?: {
    id?: string;
    role?: string;
    email?: string | null;
  };
};

const PRODUCT_TRANSITION_HOLD_MS = 920;

function ArrowIcon({direction}: {direction: "left" | "right"}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

function StarIcon({filled}: {filled: boolean}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${filled ? "fill-gold text-gold" : "text-gold/35"}`}
    >
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M12 3.75l2.49 5.04 5.56.81-4.03 3.92.95 5.54L12 16.45l-4.97 2.61.95-5.54L3.95 9.6l5.56-.81L12 3.75z"
      />
    </svg>
  );
}

function formatScentProfile(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ProductInformationDisclosure({
  id,
  title,
  isOpen,
  onToggle,
  children
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-outline/70">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={onToggle}
        className="focus-gold flex min-h-14 w-full items-center justify-between gap-5 py-4 text-left text-parchment transition-colors hover:text-gold"
      >
        <span className="label-caps text-xs">{title}</span>
        <span aria-hidden="true" className="font-serif text-2xl leading-none">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        id={id}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-outline/45 pb-5 pt-4 text-sm leading-6 text-on-surface/80">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProductDetailClient({
  slug,
  initialProduct
}: {
  slug: string;
  initialProduct?: ProductDetail | null;
}) {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const [transitionPreview] = useState(() =>
    getPendingProductTransition(slug)
  );
  const [product, setProduct] = useState<ProductDetail | null>(() =>
    transitionPreview ? null : (initialProduct ?? null)
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    transitionPreview || !initialProduct ? "loading" : "ready"
  );
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState("");
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockEmail, setRestockEmail] = useState("");
  const [restockStatus, setRestockStatus] = useState("");
  const [restockSubmitting, setRestockSubmitting] = useState(false);
  const [restockSaved, setRestockSaved] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [openProductInformation, setOpenProductInformation] = useState<string | null>(
    "scent-details"
  );
  const transitionStyle = transitionPreview
    ? {viewTransitionName: getProductTransitionName(slug)}
    : undefined;

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );
  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
    [locale]
  );

  useEffect(() => {
    if (initialProduct && !transitionPreview) return;

    let isMounted = true;
    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    const loadStartedAt = performance.now();

    async function loadProduct() {
      try {
        const data = initialProduct ?? (await (async () => {
          const response = await fetch(`/api/storefront/fragrances/${slug}`, {
            headers: {Accept: "application/json"}
          });

          if (!response.ok) {
            throw new Error("Unable to load fragrance");
          }

          return (await response.json()) as ProductDetail;
        })());
        if (isMounted) {
          const revealProduct = () => {
            if (!isMounted) return;
            setProduct(data);
            setStatus("ready");
          };
          const elapsed = performance.now() - loadStartedAt;
          const revealDelay = transitionPreview
            ? Math.max(0, PRODUCT_TRANSITION_HOLD_MS - elapsed)
            : 0;

          if (revealDelay > 0) {
            revealTimer = setTimeout(revealProduct, revealDelay);
          } else {
            revealProduct();
          }
        }
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [initialProduct, slug, transitionPreview]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          headers: {Accept: "application/json"}
        });
        const data = (await response.json()) as SessionResponse;

        if (isMounted) {
          setIsSignedIn(Boolean(data.user?.id));
          setIsAdmin(data.user?.role === "ADMIN");
          if (data.user?.email) {
            setRestockEmail((current) => current || data.user?.email || "");
          }
        }
      } catch {
        if (isMounted) {
          setIsSignedIn(false);
          setIsAdmin(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const images = product?.images ?? [];
  const selectedImage = images[activeImage] ?? images[0] ?? null;
  const selectedVariant = useMemo(() => {
    if (!product || product.variants.length === 0) return null;
    if (selectedVariantId) {
      return product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
    }
    return product.variants.find((v) => v.sizeML === 50) ?? product.variants[0];
  }, [product, selectedVariantId]);
  const productName = product
    ? isArabic
      ? product.nameAr
      : product.nameEn
    : "";
  const description = product
    ? isArabic
      ? product.descriptionAr
      : product.descriptionEn
    : "";
  const tagline = product
    ? isArabic
      ? product.taglineAr
      : product.taglineEn
    : "";
  const price = selectedVariant ? Number(selectedVariant.price) : 0;
  const originalPrice = selectedVariant
    ? Number(selectedVariant.originalPrice)
    : price;
  const rating = product ? Math.round(Number(product.ratingAverage)) : 0;

  function formatDiscountBadge(discount: ActiveProductDiscount) {
    return productDiscountBadge(discount, (amount) => priceFormatter.format(amount));
  }

  function moveImage(direction: "previous" | "next") {
    if (images.length < 2) return;
    setActiveImage((current) =>
      direction === "previous"
        ? (current - 1 + images.length) % images.length
        : (current + 1) % images.length
    );
  }

  function performAddToCart() {
    if (!product || !selectedVariant) return false;

    const item: CartItem = {
      fragranceId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: productName,
      image: selectedImage?.url ?? null,
      sizeML: selectedVariant.sizeML,
      price: selectedVariant.price,
      originalPrice: selectedVariant.originalPrice,
      discount: product.discount,
      quantity
    };

    const existing = JSON.parse(
      window.localStorage.getItem("valentro-cart") ?? "[]"
    ) as CartItem[];
    const itemIndex = existing.findIndex(
      (cartItem) => cartItem.variantId === item.variantId
    );

    if (itemIndex >= 0) {
      existing[itemIndex] = {
        ...existing[itemIndex],
        ...item,
        quantity: existing[itemIndex].quantity + quantity
      };
    } else {
      existing.push(item);
    }

    window.localStorage.setItem("valentro-cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("valentro-cart-updated"));
    return true;
  }

  function addToCart() {
    if (performAddToCart()) {
      setCartStatus(isArabic ? "تمت الإضافة إلى السلة" : "Added to cart");
    }
  }

  function buyNow() {
    if (performAddToCart()) {
      router.push(`/${locale}/checkout`);
    }
  }

  async function submitRestockRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVariant) return;

    setRestockSubmitting(true);
    setRestockStatus("");

    try {
      const response = await fetch("/api/storefront/restock-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          email: restockEmail,
          locale
        })
      });
      const result = (await response.json()) as {message?: string};

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to save your restock request");
      }

      setRestockSaved(true);
      setRestockStatus(
        result.message ??
          (isArabic
            ? "سنرسل لك رسالة عند توفر هذا العطر."
            : "We'll email you when this fragrance is back in stock.")
      );
    } catch (error) {
      setRestockSaved(false);
      setRestockStatus(
        error instanceof Error ? error.message : "Unable to save your restock request"
      );
    } finally {
      setRestockSubmitting(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewStatus("");

    const response = await fetch(`/api/storefront/fragrances/${slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        rating: reviewRating,
        messageEn: reviewMessage
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as {message?: string};
      setReviewStatus(data.message ?? "Unable to save review");
      return;
    }

    const refreshed = await fetch(`/api/storefront/fragrances/${slug}`, {
      headers: {Accept: "application/json"}
    });
    const data = (await refreshed.json()) as ProductDetail;
    setProduct(data);
    setReviewMessage("");
    setShowReviewForm(false);
    setReviewStatus(isArabic ? "تم حفظ التقييم" : "Review saved");
  }

  async function handleDeleteReview() {
    if (!reviewToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/storefront/fragrances/${slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          reviewId: reviewToDelete
        })
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      // Refresh product data
      const refreshed = await fetch(`/api/storefront/fragrances/${slug}`, {
        headers: {Accept: "application/json"}
      });
      const data = (await refreshed.json()) as ProductDetail;
      setProduct(data);
      setReviewToDelete(null);
    } catch (error) {
      console.error(error);
      alert(isArabic ? "فشل حذف التقييم" : "Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  }

  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (direction: "left" | "right") => {
    if (reviewsScrollRef.current) {
      const container = reviewsScrollRef.current;
      const cardWidth = container.firstElementChild?.getBoundingClientRect().width ?? 300;
      const scrollAmount = direction === "left" ? -cardWidth - 24 : cardWidth + 24;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (status === "loading") {
    return (
      <main
        data-route-loading="true"
        className="min-h-screen bg-bg px-gutter pb-24 pt-32 text-parchment lg:px-16"
      >
        <div className="mx-auto grid max-w-container gap-10 md:grid-cols-12 md:items-start">
          <div className="flex flex-col gap-6 md:col-span-7 md:flex-row">
            <div className="hidden shrink-0 md:block md:w-24" />
            <div
              data-product-transition-target={slug}
              style={transitionStyle}
              className="relative aspect-[4/5] w-full overflow-hidden bg-surface-mid/60"
            >
              {transitionPreview ? (
                <Image
                  src={transitionPreview.imageUrl}
                  alt={transitionPreview.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full animate-pulse bg-surface-mid/60" />
              )}
            </div>
          </div>
          <div className="space-y-5 md:col-span-5">
            <div className="h-4 w-32 animate-pulse bg-surface-mid/60" />
            <div className="h-16 w-4/5 animate-pulse bg-surface-mid/60" />
            <div className="h-7 w-40 animate-pulse bg-surface-mid/60" />
          </div>
        </div>
      </main>
    );
  }

  if (status === "error" || !product || !selectedVariant) {
    return (
      <main className="min-h-screen bg-bg px-gutter pb-24 pt-36 text-parchment lg:px-16">
        <div className="mx-auto max-w-container border border-outline bg-surface px-5 py-6 text-on-surface">
          This fragrance could not be loaded.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-gutter pb-24 pt-32 text-parchment lg:px-16">
      <div className="mx-auto max-w-container">
        <section className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7 flex flex-col gap-6 md:flex-row">
            <div
              className={`no-scrollbar flex shrink-0 gap-4 overflow-x-auto pb-2 md:w-24 md:flex-col md:overflow-visible md:pb-0 ${
                transitionPreview ? "product-detail-thumbnails-reveal" : ""
              }`}
            >
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                  className={`relative h-24 w-20 shrink-0 overflow-hidden border bg-surface-mid transition-opacity ${
                    index === activeImage
                      ? "border-gold opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={isArabic ? image.altAr : image.altEn}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div
              data-product-transition-target={slug}
              style={transitionStyle}
              className="relative aspect-[4/5] w-full overflow-hidden bg-surface-mid"
            >
              {transitionPreview ? (
                <Image
                  src={transitionPreview.imageUrl}
                  alt=""
                  fill
                  priority
                  aria-hidden="true"
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="z-0 object-cover"
                />
              ) : null}
              {selectedImage ? (
                <Image
                  src={selectedImage.url}
                  alt={isArabic ? selectedImage.altAr : selectedImage.altEn}
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className={`z-10 object-cover transition-transform duration-700 ease-out hover:scale-[1.02] ${
                    transitionPreview ? "product-detail-image-reveal" : ""
                  }`}
                />
              ) : null}
              {product.discount ? (
                <span className="label-caps absolute right-4 top-4 z-30 bg-gold px-4 py-2.5 text-surface-hi shadow-lg shadow-bg/20">
                  {formatDiscountBadge(product.discount)}
                </span>
              ) : null}
              {images.length > 1 ? (
                <div className="absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 justify-between">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => moveImage("previous")}
                    className="focus-gold flex h-11 w-11 items-center justify-center border border-gold/50 bg-bg/75 text-parchment backdrop-blur-sm hover:border-gold"
                  >
                    <ArrowIcon direction={isArabic ? "right" : "left"} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => moveImage("next")}
                    className="focus-gold flex h-11 w-11 items-center justify-center border border-gold/50 bg-bg/75 text-parchment backdrop-blur-sm hover:border-gold"
                  >
                    <ArrowIcon direction={isArabic ? "left" : "right"} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={`flex h-full flex-col justify-center md:col-span-5 md:pl-8 lg:pl-12 ${
              transitionPreview ? "product-detail-copy-reveal" : ""
            }`}
          >
            <Link
              href={`/${locale}/fragrances`}
              className="label-caps mb-5 inline-flex items-center gap-1.5 text-[10px] text-on-surface/70 transition-colors hover:text-gold"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                {isArabic ? (
                  <path d="M5 12h14M12 5l7 7-7 7" />
                ) : (
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                )}
              </svg>
              {isArabic ? "العودة إلى التسوق" : "Back to Shopping"}
            </Link>
            <p className="label-caps mb-4 text-gold">
              {formatScentProfile(product.scentProfile)}
            </p>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.03] text-parchment">
              {productName}
            </h1>
            <p className="mt-5 text-lg leading-7 text-on-surface/75">
              {tagline}
            </p>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {product.discount ? (
                <span className="font-serif text-xl text-on-surface/50 line-through decoration-on-surface/50">
                  {priceFormatter.format(originalPrice)}
                </span>
              ) : null}
              <span
                className={`font-serif text-3xl leading-10 ${
                  product.discount ? "text-gold" : "text-parchment"
                }`}
              >
                {priceFormatter.format(price)}
              </span>
            </div>
            <p className="mt-8 max-w-xl text-base leading-7 text-on-surface/80">
              {description}
            </p>

            <div className="my-8 h-px w-1/3 bg-outline/70" />

            <div className="mb-8">
              <p className="label-caps mb-4 text-parchment">
                {isArabic ? "اختر الحجم" : "Select Size"}
              </p>
              <div className="flex flex-wrap gap-4">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setCartStatus("");
                      }}
                      className={`label-caps min-h-11 border px-8 transition-colors ${
                        isSelected
                          ? "border-parchment bg-parchment text-surface-hi"
                          : "border-outline hover:border-gold hover:text-gold text-parchment"
                      }`}
                    >
                      {variant.sizeML}ml
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex min-h-12 items-center border border-outline">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="focus-gold h-12 px-4 text-parchment hover:text-gold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm text-parchment">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((value) => value + 1)}
                    className="focus-gold h-12 px-4 text-parchment hover:text-gold"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={selectedVariant.stock < 1}
                  className="label-caps focus-gold inline-flex min-h-12 flex-1 items-center justify-center gap-3 border border-outline px-8 text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isArabic ? "إضافة إلى السلة" : "Add to Cart"}
                </button>
              </div>
              <button
                type="button"
                onClick={buyNow}
                disabled={selectedVariant.stock < 1}
                className="label-caps focus-gold inline-flex min-h-12 w-full items-center justify-center gap-3 border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isArabic ? "شراء الآن" : "Buy Now"}
                <ArrowIcon direction={isArabic ? "left" : "right"} />
              </button>
            </div>

            <div className="mb-6 border-t border-outline/70">
              <ProductInformationDisclosure
                id="scent-details"
                title={isArabic ? "الطابع والأداء" : "Scent Profile & Performance"}
                isOpen={openProductInformation === "scent-details"}
                onToggle={() =>
                  setOpenProductInformation((current) =>
                    current === "scent-details" ? null : "scent-details"
                  )
                }
              >
                <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <dt className="label-caps text-[10px] text-gold">
                      {isArabic ? "الطابع" : "Profile"}
                    </dt>
                    <dd className="mt-1 text-parchment">
                      {formatScentProfile(product.scentProfile)}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-[10px] text-gold">
                      {isArabic ? "الفوحان" : "Sillage"}
                    </dt>
                    <dd className="mt-1 text-parchment">
                      {formatScentProfile(product.sillage)}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-[10px] text-gold">
                      {isArabic ? "الثبات" : "Longevity"}
                    </dt>
                    <dd className="mt-1 text-parchment">
                      {product.longevity} {isArabic ? "ساعات" : "hours"}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-[10px] text-gold">
                      {isArabic ? "النوتات" : "Notes"}
                    </dt>
                    <dd className="mt-1 text-parchment">
                      {product.ingredients.length > 0
                        ? product.ingredients
                            .map((ingredient) =>
                              isArabic ? ingredient.nameAr : ingredient.nameEn
                            )
                            .join(" · ")
                        : isArabic
                          ? "تركيبة فريدة"
                          : "Signature composition"}
                    </dd>
                  </div>
                </dl>
              </ProductInformationDisclosure>

              <ProductInformationDisclosure
                id="delivery-payment"
                title={isArabic ? "التوصيل والدفع" : "Delivery & Payment"}
                isOpen={openProductInformation === "delivery-payment"}
                onToggle={() =>
                  setOpenProductInformation((current) =>
                    current === "delivery-payment" ? null : "delivery-payment"
                  )
                }
              >
                <p>
                  {isArabic
                    ? "التوصيل متاح إلى المحافظات المدعومة في مصر. الدفع عند الاستلام، وسيتواصل فريقنا معك لتأكيد الطلب."
                    : "Delivery is available across supported Egyptian governorates. Pay by cash on delivery, then our team will contact you to confirm the order."}
                </p>
              </ProductInformationDisclosure>

              <ProductInformationDisclosure
                id="care-returns"
                title={isArabic ? "العناية والاسترجاع" : "Care & Returns"}
                isOpen={openProductInformation === "care-returns"}
                onToggle={() =>
                  setOpenProductInformation((current) =>
                    current === "care-returns" ? null : "care-returns"
                  )
                }
              >
                <p>
                  {isArabic
                    ? "احفظ العطر بعيدًا عن الحرارة وأشعة الشمس المباشرة. يمكن طلب استرجاع المنتجات المؤهلة غير المفتوحة خلال 30 يومًا من الاستلام."
                    : "Store your fragrance away from heat and direct sunlight. Eligible unopened items can be requested for return within 30 days of delivery."}
                </p>
                <Link
                  href={`/${locale}/refund-policy`}
                  className="label-caps focus-gold mt-3 inline-flex text-[10px] text-gold underline-offset-4 hover:underline"
                >
                  {isArabic ? "عرض سياسة الاسترجاع" : "View refund policy"}
                </Link>
              </ProductInformationDisclosure>
            </div>

            <p className="label-caps flex items-center gap-2 text-on-surface/70">
              <span className="h-2 w-2 bg-gold" />
              {selectedVariant.stock > 0
                ? "In Stock - Ready for immediate dispatch"
                : "Currently out of stock"}
            </p>
            {selectedVariant.stock < 1 ? (
              <button
                type="button"
                onClick={() => {
                  setRestockStatus("");
                  setRestockSaved(false);
                  setShowRestockModal(true);
                }}
                className="label-caps focus-gold mt-5 inline-flex min-h-12 w-full items-center justify-center border border-gold px-8 text-gold transition-colors hover:bg-gold hover:text-surface-hi"
              >
                {isArabic ? "هل ترغب بهذا العطر؟" : "Want that product?"}
              </button>
            ) : null}
            {cartStatus ? (
              <p className="mt-4 text-sm text-gold">{cartStatus}</p>
            ) : null}
          </div>
        </section>

        <section className="mt-20 border-t border-outline/60 pt-14 lg:mt-24">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-serif text-3xl leading-tight text-parchment sm:text-4xl">
                Client Reviews
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <StarIcon key={value} filled={value <= rating} />
                  ))}
                </div>
                <span className="text-sm text-on-surface/75">
                  {Number(product.ratingAverage).toFixed(1)} / 5 based on{" "}
                  {product.ratingCount} reviews
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {product.reviews.length > 3 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => scrollReviews("left")}
                    className="focus-gold flex h-9 w-9 items-center justify-center border border-outline text-parchment hover:border-gold hover:text-gold transition-colors"
                    aria-label="Previous reviews"
                  >
                    <ArrowIcon direction={isArabic ? "right" : "left"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollReviews("right")}
                    className="focus-gold flex h-9 w-9 items-center justify-center border border-outline text-parchment hover:border-gold hover:text-gold transition-colors"
                    aria-label="Next reviews"
                  >
                    <ArrowIcon direction={isArabic ? "left" : "right"} />
                  </button>
                </div>
              )}
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => setShowReviewForm((value) => !value)}
                  className="label-caps min-h-11 border border-parchment px-8 text-parchment transition-colors hover:bg-parchment hover:text-surface-hi"
                >
                  Write a Review
                </button>
              ) : (
                <a
                  href={`/${locale}/login`}
                  className="label-caps inline-flex min-h-11 items-center justify-center border border-parchment px-8 text-parchment transition-colors hover:bg-parchment hover:text-surface-hi"
                >
                  Sign in to Review
                </a>
              )}
            </div>
          </div>

          {showReviewForm ? (
            <form
              onSubmit={submitReview}
              className="mb-12 border border-outline/60 bg-surface px-5 py-6"
            >
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="label-caps text-parchment">Your Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} star rating`}
                      onClick={() => setReviewRating(value)}
                      className="focus-gold"
                    >
                      <StarIcon filled={value <= reviewRating} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                value={reviewMessage}
                onChange={(event) => setReviewMessage(event.target.value)}
                placeholder="Share your experience"
                className="min-h-28 w-full border border-outline bg-bg px-4 py-3 text-sm leading-6 text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold"
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="label-caps min-h-11 border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
                >
                  Submit Review
                </button>
                {reviewStatus ? (
                  <p className="text-sm text-gold">{reviewStatus}</p>
                ) : null}
              </div>
            </form>
          ) : reviewStatus ? (
            <p className="mb-8 text-sm text-gold">{reviewStatus}</p>
          ) : null}

          {product.reviews.length > 0 ? (
            <div
              ref={reviewsScrollRef}
              className="no-scrollbar flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory flex-nowrap pb-4"
            >
              {product.reviews.map((review) => {
                const reviewMessage =
                  isArabic && review.messageAr
                    ? review.messageAr
                    : review.messageEn;

                return (
                  <article
                    key={review.id}
                    className="relative flex flex-col p-5 border border-outline/20 bg-surface/30 snap-start shrink-0 w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]"
                  >
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setReviewToDelete(review.id)}
                        className={`absolute top-4 ${isArabic ? "left-4" : "right-4"} text-on-surface/50 hover:text-red-400 transition-colors text-lg font-bold leading-none`}
                        title={isArabic ? "حذف التقييم" : "Delete review"}
                      >
                        ×
                      </button>
                    ) : null}
                    <div className="mb-4 flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <StarIcon key={value} filled={value <= review.rating} />
                      ))}
                    </div>
                    <p className="mb-6 flex-grow text-base leading-7 text-on-surface/80">
                      &ldquo;{reviewMessage}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <p className="label-caps text-gold">
                        - {review.reviewerName}
                      </p>
                      <time
                        dateTime={review.createdAt}
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface/55"
                      >
                        {reviewDateFormatter.format(new Date(review.createdAt))}
                      </time>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface/70">
              No published reviews yet.
            </p>
          )}
        </section>
      </div>
      <Modal
        isOpen={showRestockModal}
        title={isArabic ? "هل ترغب بهذا العطر؟" : "Want that product?"}
        onClose={() => {
          if (!restockSubmitting) setShowRestockModal(false);
        }}
      >
        {restockSaved ? (
          <div className="space-y-6">
            <p role="status" className="text-sm leading-7 text-on-surface/85">
              {restockStatus}
            </p>
            <button
              type="button"
              onClick={() => setShowRestockModal(false)}
              className="label-caps focus-gold min-h-12 w-full border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
            >
              {isArabic ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={submitRestockRequest} className="space-y-6">
            <p className="text-sm leading-7 text-on-surface/80">
              {isArabic
                ? `أدخل بريدك الإلكتروني وسنخبرك عند توفر ${productName}${selectedVariant ? ` بحجم ${selectedVariant.sizeML} مل` : ""}. يساعدنا طلبك أيضًا على إعطاء هذا العطر أولوية أعلى في إعادة التخزين.`
                : `Enter your email and we'll let you know when ${productName}${selectedVariant ? ` ${selectedVariant.sizeML}ml` : ""} is available again. Your request also helps us prioritize this fragrance for restocking.`}
            </p>
            <label className="block">
              <span className="label-caps mb-2 block text-gold">
                {isArabic ? "البريد الإلكتروني" : "Email address"}
              </span>
              <input
                type="email"
                value={restockEmail}
                onChange={(event) => setRestockEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="focus-gold w-full border border-outline bg-surface px-4 py-3 text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold"
              />
            </label>
            {restockStatus ? (
              <p role="alert" className="text-sm text-red-300">
                {restockStatus}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                disabled={restockSubmitting}
                className="label-caps min-h-11 border border-outline px-6 text-parchment transition-colors hover:bg-surface-mid disabled:opacity-50"
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={restockSubmitting}
                className="label-caps focus-gold min-h-11 border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-wait disabled:opacity-50"
              >
                {restockSubmitting
                  ? isArabic
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isArabic
                    ? "أخبرني عند التوفر"
                    : "Notify me"}
              </button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={Boolean(reviewToDelete)}
        title={isArabic ? "حذف التقييم" : "Delete Review"}
        onClose={() => setReviewToDelete(null)}
      >
        <div className="space-y-6">
          <p className="text-sm leading-6 text-on-surface/80">
            {isArabic
              ? "هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟ سيتم حذف جميع البيانات المرتبطة به أيضاً."
              : "Are you sure you want to delete this review entirely? This will also remove any related info associated with it."}
          </p>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setReviewToDelete(null)}
              className="label-caps min-h-11 border border-outline px-6 text-parchment hover:bg-surface-mid transition-colors"
              disabled={isDeleting}
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleDeleteReview}
              className="label-caps min-h-11 border border-red-500/30 bg-red-950/20 px-6 text-red-400 hover:border-red-500 hover:bg-red-950/60 hover:text-red-200 transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting
                ? (isArabic ? "جاري الحذف..." : "Deleting...")
                : (isArabic ? "نعم، احذف" : "Yes, Delete")}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
