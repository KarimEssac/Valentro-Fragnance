"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type {FormEvent} from "react";
import {useEffect, useMemo, useRef, useState} from "react";

import Modal from "@/components/ui/Modal";

type ProductImage = {
  id: string;
  url: string;
  altEn: string;
  altAr: string;
  position: number;
  isPrimary: boolean;
};

type ProductVariant = {
  id: string;
  sizeML: number;
  price: string;
  compareAtPrice: string | null;
  stock: number;
  sku: string;
};

type ProductReview = {
  id: string;
  reviewerName: string;
  rating: number;
  messageEn: string;
  messageAr: string | null;
  createdAt: string;
};

type ProductDetail = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  scentProfile: string;
  ratingAverage: string;
  ratingCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: ProductReview[];
};

type CartItem = {
  fragranceId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string | null;
  sizeML: number;
  price: string;
  quantity: number;
};

type SessionResponse = {
  user?: {
    id?: string;
    role?: string;
  };
};

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

export default function ProductDetailClient({slug}: {slug: string}) {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        const response = await fetch(`/api/storefront/fragrances/${slug}`, {
          headers: {Accept: "application/json"}
        });

        if (!response.ok) {
          throw new Error("Unable to load fragrance");
        }

        const data = (await response.json()) as ProductDetail;
        if (isMounted) {
          setProduct(data);
          setStatus("ready");
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
    };
  }, [slug]);

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
  const selectedVariant =
    product?.variants.find((variant) => variant.sizeML === 50) ??
    product?.variants[0] ??
    null;
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
  const rating = product ? Math.round(Number(product.ratingAverage)) : 0;

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
      sizeML: 50,
      price: selectedVariant.price,
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
        className="min-h-screen bg-bg px-gutter pb-24 pt-36 text-parchment lg:px-16"
      >
        <div className="mx-auto grid max-w-container gap-10 md:grid-cols-12">
          <div className="h-[620px] animate-pulse bg-surface-mid/60 md:col-span-7" />
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
          <div className="md:col-span-7 flex flex-col-reverse gap-6 md:flex-row">
            <div className="no-scrollbar flex shrink-0 gap-4 overflow-x-auto pb-2 md:w-24 md:flex-col md:overflow-visible md:pb-0">
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

            <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-mid">
              {selectedImage ? (
                <Image
                  src={selectedImage.url}
                  alt={isArabic ? selectedImage.altAr : selectedImage.altEn}
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out hover:scale-[1.02]"
                />
              ) : null}
              {images.length > 1 ? (
                <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
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

          <div className="flex h-full flex-col justify-center md:col-span-5 md:pl-8 lg:pl-12">
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
            <p className="mt-6 font-serif text-3xl leading-10 text-parchment">
              {priceFormatter.format(price)}
            </p>
            <p className="mt-8 max-w-xl text-base leading-7 text-on-surface/80">
              {description}
            </p>

            <div className="my-8 h-px w-1/3 bg-outline/70" />

            <div className="mb-8">
              <p className="label-caps mb-4 text-parchment">Select Size</p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="label-caps min-h-11 border border-parchment bg-parchment px-8 text-surface-hi"
                >
                  50ml
                </button>
                <button
                  type="button"
                  disabled
                  className="label-caps min-h-11 cursor-not-allowed border border-outline/60 px-8 text-on-surface/45"
                >
                  100ml Soon
                </button>
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

            <p className="label-caps flex items-center gap-2 text-on-surface/70">
              <span className="h-2 w-2 bg-gold" />
              {selectedVariant.stock > 0
                ? "In Stock - Ready for immediate dispatch"
                : "Currently out of stock"}
            </p>
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
                    <p className="label-caps text-gold">
                      - {review.reviewerName}
                    </p>
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
