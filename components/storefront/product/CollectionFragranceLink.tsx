"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import type {MouseEvent, ReactNode} from "react";

import {startProductImageTransition} from "@/lib/product-image-transition";

type CollectionFragranceLinkProps = {
  locale: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string;
  className?: string;
  children: ReactNode;
};

export default function CollectionFragranceLink({
  locale,
  slug,
  imageUrl,
  imageAlt,
  className,
  children
}: CollectionFragranceLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !imageUrl
    ) {
      return;
    }

    const source = event.currentTarget.querySelector<HTMLElement>(
      "[data-product-transition-source]"
    );
    if (!source) return;

    const href = `/${locale}/fragrances/${slug}`;
    const didStart = startProductImageTransition({
      slug,
      imageUrl,
      imageAlt,
      source,
      navigate: () => router.push(href)
    });

    if (didStart) event.preventDefault();
  }

  return (
    <Link
      href={`/${locale}/fragrances/${slug}`}
      onClick={handleClick}
      data-product-image-transition-link
      className={className}
    >
      {children}
    </Link>
  );
}
