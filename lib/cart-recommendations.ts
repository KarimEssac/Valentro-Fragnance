type RecommendationCandidate = {
  id: string;
  isFeatured?: boolean;
  variants: {stock: number}[];
};

export function selectCartRecommendations<T extends RecommendationCandidate>(
  recommendations: T[],
  cartFragranceIds: ReadonlySet<string>,
  limit: number
): T[] {
  return recommendations
    .filter((item) => !cartFragranceIds.has(item.id) && item.variants.length > 0)
    .sort((first, second) =>
      Number(second.variants.some((variant) => variant.stock > 0)) -
        Number(first.variants.some((variant) => variant.stock > 0)) ||
      Number(Boolean(second.isFeatured)) - Number(Boolean(first.isFeatured))
    )
    .slice(0, limit);
}
