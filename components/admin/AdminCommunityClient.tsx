"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";

type CommunityAccount = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  spent: number;
  orderCount: number;
};

type NewsletterSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

type CommunityReview = {
  id: string;
  reviewerName: string;
  userEmail: string;
  rating: number;
  messageEn: string;
  messageAr: string | null;
  isPublished: boolean;
  createdAt: string;
  testimonialId: string | null;
  isTestimonial: boolean;
  testimonialPosition: number | null;
  fragrance: {
    slug: string;
    nameEn: string;
    nameAr: string;
    image: {
      url: string;
      altEn: string;
      altAr: string;
    } | null;
  };
};

type RestockDemand = {
  fragranceId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: {url: string; altEn: string; altAr: string} | null;
  activeRequestCount: number;
  totalDemand: number;
  latestRequestAt: string;
  variants: {
    id: string;
    sizeML: number;
    sku: string;
    stock: number;
    activeRequestCount: number;
    totalDemand: number;
    latestRequestAt: string;
    requesters: {email: string; requestedAt: string; locale: string}[];
  }[];
};

type AdminCommunityClientProps = {
  accounts: CommunityAccount[];
  subscribers: NewsletterSubscriber[];
  reviews: CommunityReview[];
  restockDemand: RestockDemand[];
  totalSpent: number;
  locale: string;
};

function formatDate(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default function AdminCommunityClient({
  accounts,
  subscribers,
  reviews,
  restockDemand,
  totalSpent,
  locale
}: AdminCommunityClientProps) {
  const isArabic = locale === "ar";
  const [communityReviews, setCommunityReviews] = useState(reviews);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );
  const topAccounts = accounts.slice(0, 8);
  const recentSubscribers = subscribers.slice(0, 8);
  const selectedTestimonials = communityReviews.filter((review) => review.isTestimonial).length;
  const activeRestockRequests = restockDemand.reduce(
    (sum, demand) => sum + demand.activeRequestCount,
    0
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function toggleReviewTestimonial(review: CommunityReview) {
    setBusyReviewId(review.id);
    setReviewStatus("");

    try {
      const response = await fetch(`/api/admin/community/reviews/${review.id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({isTestimonial: !review.isTestimonial})
      });
      const result = (await response.json()) as {
        message?: string;
        isTestimonial?: boolean;
        testimonialId?: string | null;
        testimonialPosition?: number | null;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to update testimonial status");
      }

      setCommunityReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? {
                ...item,
                isTestimonial: Boolean(result.isTestimonial),
                testimonialId: result.testimonialId ?? item.testimonialId,
                testimonialPosition: result.testimonialPosition ?? null
              }
            : item
        )
      );
      setReviewStatus(result.message ?? "Review updated.");
    } catch (error) {
      setReviewStatus(error instanceof Error ? error.message : "Unable to update review");
    } finally {
      setBusyReviewId(null);
    }
  }

  async function deleteReview(reviewId: string) {
    setBusyReviewId(reviewId);
    setReviewStatus("");

    try {
      const response = await fetch(`/api/admin/community/reviews/${reviewId}`, {
        method: "DELETE"
      });
      const result = (await response.json()) as {message?: string};

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to delete review");
      }

      setCommunityReviews((current) => current.filter((review) => review.id !== reviewId));
      setReviewToDelete(null);
      setReviewStatus(result.message ?? "Review deleted.");
    } catch (error) {
      setReviewStatus(error instanceof Error ? error.message : "Unable to delete review");
    } finally {
      setBusyReviewId(null);
    }
  }

  async function sendDispatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("subject", subject);
      form.append("body", body);
      if (imageFile) form.append("image", imageFile);

      const response = await fetch("/api/admin/community/dispatch", {
        method: "POST",
        body: form
      });
      const result = (await response.json()) as {message?: string};

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to send dispatch");
      }

      setSubject("");
      setBody("");
      setImageFile(null);
      setStatus(result.message ?? "Dispatch sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send dispatch");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-container px-gutter py-10 text-parchment sm:py-12 lg:px-16">
      <header className="mb-12 max-w-3xl">
        <p className="label-caps mb-3 text-gold">Maison Community</p>
        <h1 className="font-serif text-[clamp(2.4rem,5vw,4.6rem)] leading-tight">
          Community
        </h1>
        <p className="mt-4 text-base leading-7 text-on-surface/75 sm:text-lg">
          Manage patron relationships, inner circle subscribers, and editorial
          communications.
        </p>
      </header>

      <div className="mb-12 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
        <div className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <p className="label-caps mb-4 text-gold">Total Accounts</p>
          <p className="font-serif text-4xl">{accounts.length}</p>
          <p className="mt-2 text-sm text-on-surface/65">registered profiles</p>
        </div>
        <div className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <p className="label-caps mb-4 text-gold">Newsletter Emails</p>
          <p className="font-serif text-4xl">{subscribers.length}</p>
          <p className="mt-2 text-sm text-on-surface/65">inner circle subscribers</p>
        </div>
        <div className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <p className="label-caps mb-4 text-gold">Cumulative Spend</p>
          <p className="font-serif text-4xl">{currency.format(totalSpent)}</p>
          <p className="mt-2 text-sm text-on-surface/65">confirmed revenue</p>
        </div>
        <div className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <p className="label-caps mb-4 text-gold">Testimonials</p>
          <p className="font-serif text-4xl">{selectedTestimonials}</p>
          <p className="mt-2 text-sm text-on-surface/65">selected customer reviews</p>
        </div>
        <div className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <p className="label-caps mb-4 text-gold">Restock Demand</p>
          <p className="font-serif text-4xl">{activeRestockRequests}</p>
          <p className="mt-2 text-sm text-on-surface/65">active product requests</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
        <section className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-outline/60 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="label-caps mb-2 text-gold">Patron Registry</p>
              <h2 className="font-serif text-3xl">Accounts</h2>
            </div>
            <span className="label-caps text-on-surface/60">
              {accounts.length} profiles
            </span>
          </div>

          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-2 md:hidden">
            {topAccounts.map((account) => (
              <article
                key={account.id}
                className="border border-outline/45 bg-surface-hi/60 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-parchment">
                    {account.name ?? account.email}
                  </p>
                  <p className="mt-1 break-all text-xs text-on-surface/65">
                    {account.email}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="label-caps text-[10px] text-on-surface/55">Role</p>
                    <p className="mt-1 text-gold">{account.role}</p>
                  </div>
                  <div>
                    <p className="label-caps text-[10px] text-on-surface/55">Since</p>
                    <p className="mt-1 text-on-surface/75">
                      {formatDate(locale, account.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="label-caps text-[10px] text-on-surface/55">Orders</p>
                    <p className="mt-1 text-on-surface/75">{account.orderCount}</p>
                  </div>
                  <div>
                    <p className="label-caps text-[10px] text-on-surface/55">Spent</p>
                    <p className="mt-1 font-semibold">
                      {currency.format(account.spent)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden max-h-[366px] overflow-y-auto pr-2 md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="label-caps border-b border-outline/60 text-[10px] text-on-surface/65">
                <tr>
                  <th className="py-3 pr-4 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Member Since</th>
                  <th className="px-4 py-3 text-right font-semibold">Orders</th>
                  <th className="py-3 pl-4 text-right font-semibold">Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/50">
                {topAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-parchment">
                        {account.name ?? account.email}
                      </p>
                      <p className="mt-1 text-xs text-on-surface/65">{account.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="label-caps text-gold">{account.role}</span>
                    </td>
                    <td className="px-4 py-4 text-on-surface/75">
                      {formatDate(locale, account.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right text-on-surface/75">
                      {account.orderCount}
                    </td>
                    <td className="py-4 pl-4 text-right font-semibold">
                      {currency.format(account.spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <div className="mb-6 border-b border-outline/60 pb-5">
            <p className="label-caps mb-2 text-gold">Inner Circle</p>
            <h2 className="font-serif text-3xl">Newsletter</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface/70">
              Recent subscriber emails collected from the storefront footer.
            </p>
          </div>
          <div className="max-h-[308px] divide-y divide-outline/50 overflow-y-auto pr-2">
            {recentSubscribers.length > 0 ? (
              recentSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="py-4">
                  <p className="text-sm font-semibold text-parchment">
                    {subscriber.email}
                  </p>
                  <p className="label-caps mt-1 text-[10px] text-on-surface/60">
                    Subscribed {formatDate(locale, subscriber.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-on-surface/70">
                No newsletter subscribers yet.
              </p>
            )}
          </div>
        </aside>
      </div>

      <section className="mt-6 border border-outline/60 bg-surface/70 p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-outline/60 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="label-caps mb-2 text-gold">Customer Voice</p>
            <h2 className="font-serif text-3xl">Reviews</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface/70">
              Select product reviews for the home page testimonial section, or remove reviews from the catalog.
            </p>
          </div>
          <span className="label-caps text-on-surface/60">
            {communityReviews.length} reviews
          </span>
        </div>

        {reviewStatus ? (
          <p className="mb-4 border border-outline/50 bg-surface-hi px-4 py-3 text-sm text-on-surface">
            {reviewStatus}
          </p>
        ) : null}

        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-2 md:hidden">
          {communityReviews.length > 0 ? (
            communityReviews.map((review) => (
              <article key={review.id} className="border border-outline/45 bg-surface-hi/60 p-4">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-outline/50 bg-surface-mid">
                    {review.fragrance.image ? (
                      <Image
                        src={review.fragrance.image.url}
                        alt={locale === "ar" ? review.fragrance.image.altAr : review.fragrance.image.altEn}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-parchment">{review.fragrance.nameEn}</p>
                    <p className="mt-1 break-all text-xs text-on-surface/65">
                      {review.reviewerName} · {review.userEmail}
                    </p>
                    <p className="label-caps mt-2 text-[10px] text-gold">
                      {review.rating}/5 · {formatDate(locale, review.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-on-surface/80">
                  &ldquo;{review.messageEn}&rdquo;
                </p>
                {review.messageAr ? (
                  <p className="mt-2 text-sm leading-6 text-on-surface/60">
                    &ldquo;{review.messageAr}&rdquo;
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReviewTestimonial(review)}
                    disabled={busyReviewId === review.id}
                    className={`label-caps min-h-10 border px-3 text-[10px] transition-colors disabled:opacity-50 ${
                      review.isTestimonial
                        ? "border-gold bg-gold text-surface-hi"
                        : "border-outline text-gold"
                    }`}
                  >
                    {review.isTestimonial ? "Remove Pick" : "Pick Testimonial"}
                  </button>
                  {reviewToDelete === review.id ? (
                    <div className="grid grid-cols-2 border border-outline">
                      <button
                        type="button"
                        onClick={() => deleteReview(review.id)}
                        disabled={busyReviewId === review.id}
                        className="text-xs font-bold text-red-700 disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewToDelete(null)}
                        className="text-xs text-on-surface"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReviewToDelete(review.id)}
                      disabled={busyReviewId === review.id}
                      className="label-caps min-h-10 border border-outline px-3 text-[10px] text-on-surface/70 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="py-4 text-sm text-on-surface/70">
              No customer reviews yet.
            </p>
          )}
        </div>

        <div className="hidden max-h-[560px] overflow-x-auto overflow-y-auto pr-2 md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="label-caps border-b border-outline/60 text-[10px] text-on-surface/65">
              <tr>
                <th className="py-3 pr-4 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Reviewer</th>
                <th className="px-4 py-3 font-semibold">Review</th>
                <th className="px-4 py-3 text-center font-semibold">Rating</th>
                <th className="px-4 py-3 text-center font-semibold">Home</th>
                <th className="py-3 pl-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/50">
              {communityReviews.length > 0 ? (
                communityReviews.map((review) => (
                  <tr key={review.id}>
                    <td className="py-4 pr-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-outline/50 bg-surface-mid">
                          {review.fragrance.image ? (
                            <Image
                              src={review.fragrance.image.url}
                              alt={locale === "ar" ? review.fragrance.image.altAr : review.fragrance.image.altEn}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-parchment">{review.fragrance.nameEn}</p>
                          <p className="mt-1 text-xs text-on-surface/60">
                            {formatDate(locale, review.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-parchment">{review.reviewerName}</p>
                      <p className="mt-1 max-w-[160px] truncate text-xs text-on-surface/65">
                        {review.userEmail}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-2 max-w-[320px] text-on-surface/80">
                        {review.messageEn}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="label-caps text-gold">{review.rating}/5</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`label-caps inline-block border px-2.5 py-1 text-[10px] ${
                        review.isTestimonial
                          ? "border-gold bg-gold text-surface-hi"
                          : "border-outline text-on-surface/60"
                      }`}>
                        {review.isTestimonial ? "Selected" : "Not picked"}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleReviewTestimonial(review)}
                          disabled={busyReviewId === review.id}
                          className="text-xs text-gold hover:underline disabled:opacity-50"
                        >
                          {review.isTestimonial ? "Remove" : "Pick"}
                        </button>
                        {reviewToDelete === review.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => deleteReview(review.id)}
                              disabled={busyReviewId === review.id}
                              className="text-xs font-bold text-red-700 hover:underline disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewToDelete(null)}
                              className="text-xs text-on-surface hover:underline"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReviewToDelete(review.id)}
                            disabled={busyReviewId === review.id}
                            className="text-xs text-on-surface/60 hover:text-red-700 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-on-surface/70">
                    No customer reviews yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="border border-outline/60 bg-surface/70 p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-outline/60 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="label-caps mb-2 text-gold">Inventory Signals</p>
              <h2 className="font-serif text-3xl">Restock Demand</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface/70">
                Products are ranked by active waitlist requests, then by total demand signals. Restocking a requested size automatically emails its active requesters.
              </p>
            </div>
            <span className="label-caps text-on-surface/60">
              {restockDemand.length} requested products
            </span>
          </div>

          {restockDemand.length > 0 ? (
            <div className="grid gap-4">
              {restockDemand.map((demand, index) => {
                const fragranceName = isArabic ? demand.nameAr : demand.nameEn;
                const imageAlt = demand.image
                  ? isArabic
                    ? demand.image.altAr
                    : demand.image.altEn
                  : fragranceName;

                return (
                  <article
                    key={demand.fragranceId}
                    className="border border-outline/45 bg-surface-hi/60 p-4 sm:p-5"
                  >
                    <div className="flex gap-4 border-b border-outline/45 pb-5">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-surface-mid">
                        {demand.image ? (
                          <Image
                            src={demand.image.url}
                            alt={imageAlt}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="label-caps text-[10px] text-gold">
                          Priority #{index + 1}
                        </p>
                        <Link
                          href={`/${locale}/fragrances/${demand.slug}`}
                          className="mt-1 block font-serif text-2xl leading-tight text-parchment transition-colors hover:text-gold"
                        >
                          {fragranceName}
                        </Link>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface/65">
                          <span>{demand.activeRequestCount} active</span>
                          <span>{demand.totalDemand} total signals</span>
                          <span>Latest {formatDate(locale, demand.latestRequestAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-outline/40">
                      {demand.variants.map((variant) => (
                        <div key={variant.id} className="py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-parchment">
                                {variant.sizeML}ml
                              </p>
                              <p className="mt-1 text-xs text-on-surface/55">
                                {variant.sku} · {variant.stock} in stock
                              </p>
                            </div>
                            <div className="text-right text-xs text-on-surface/65">
                              <p className="font-semibold text-gold">
                                {variant.activeRequestCount} waiting
                              </p>
                              <p className="mt-1">{variant.totalDemand} demand signals</p>
                            </div>
                          </div>

                          {variant.requesters.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {variant.requesters.slice(0, 6).map((requester) => (
                                <span
                                  key={`${variant.id}-${requester.email}`}
                                  title={`Requested ${formatDate(locale, requester.requestedAt)}`}
                                  className="border border-outline/45 bg-surface px-2.5 py-1 text-xs text-on-surface/75"
                                >
                                  {requester.email}
                                </span>
                              ))}
                              {variant.requesters.length > 6 ? (
                                <span className="px-2.5 py-1 text-xs text-on-surface/55">
                                  +{variant.requesters.length - 6} more
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-on-surface/55">
                              No active waitlist; historical demand is retained for planning.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-sm text-on-surface/70">
              No restock requests have been submitted yet.
            </p>
          )}
        </section>

        <section className="border border-outline/60 bg-surface/70 p-4 sm:p-6 xl:max-w-3xl">
          <p className="label-caps mb-2 text-gold">Editorial Dispatch</p>
          <h2 className="font-serif text-3xl">Send News</h2>
          <form onSubmit={sendDispatch} className="mt-6 space-y-6">
          <label className="block">
            <span className="label-caps mb-2 block text-on-surface/70">Subject</span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={140}
              placeholder="e.g. The Autumn Collection Reveal"
              className="w-full border-0 border-b border-outline bg-transparent px-0 py-3 text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold focus:ring-0"
            />
          </label>
          <label className="block">
            <span className="label-caps mb-2 block text-on-surface/70">
              Editorial Body
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              rows={8}
              placeholder="Draft your message to the inner circle..."
              className="w-full resize-none border-0 border-b border-outline bg-transparent px-0 py-3 text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold focus:ring-0"
            />
          </label>
          <div>
            <label className="block">
              <span className="label-caps mb-2 block text-on-surface/70">
                Featured Image <span className="text-on-surface/45">(optional)</span>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="block w-full border border-outline/60 bg-surface-hi px-3 py-3 text-sm text-on-surface file:mr-4 file:border-0 file:bg-parchment file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-surface-hi"
              />
            </label>
            {imagePreview ? (
              <div className="mt-4 flex items-start gap-4 border border-outline/60 bg-surface-hi p-3">
                <div
                  role="img"
                  aria-label="Selected newsletter image preview"
                  className="h-24 w-32 shrink-0 bg-cover bg-center bg-no-repeat"
                  style={{backgroundImage: `url(${imagePreview})`}}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-parchment">{imageFile?.name}</p>
                  <p className="mt-1 text-xs text-on-surface/65">
                    This image will appear below the newsletter subject.
                  </p>
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="label-caps mt-3 text-[10px] text-gold hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : null}
            <p className="mt-2 text-xs text-on-surface/55">
              JPG, PNG, or WebP up to 5MB. The image is optimized before sending.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface/65">
              Sends to {subscribers.length} newsletter subscriber{subscribers.length === 1 ? "" : "s"}.
            </p>
            <button
              type="submit"
              disabled={isSending || subscribers.length === 0}
              className="label-caps min-h-12 border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Dispatch to Community"}
            </button>
          </div>
          {status ? (
            <p className="border border-outline/50 bg-surface-hi px-4 py-3 text-sm text-on-surface">
              {status}
            </p>
          ) : null}
          </form>
        </section>
      </div>
    </section>
  );
}
