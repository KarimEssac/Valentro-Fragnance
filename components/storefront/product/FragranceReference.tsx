import Image from "next/image";

type FragranceReferenceProps = {
  imageUrl?: string | null;
  productName: string;
  isArabic: boolean;
  variant?: "card" | "detail";
};

export default function FragranceReference({
  imageUrl,
  productName,
  isArabic,
  variant = "card"
}: FragranceReferenceProps) {
  if (!imageUrl) return null;
  const isDetail = variant === "detail";

  return (
    <div
      data-fragrance-reference
      className={`pointer-events-none absolute z-30 inline-flex max-w-[calc(100%_-_1.5rem)] items-center overflow-hidden rounded-[2px] border border-white/20 bg-black shadow-[0_10px_28px_-14px_rgba(0,0,0,0.8)] ${
        isDetail
          ? "start-2.5 top-2.5 gap-2 px-2.5 py-2 sm:start-5 sm:top-5 sm:gap-4 sm:px-4 sm:py-3"
          : "start-2.5 top-2.5 gap-2 px-2 py-2 sm:start-3 sm:top-3"
      }`}
    >
      <span aria-hidden="true" className="absolute inset-[3px] rounded-[1px] border border-white/[0.07]" />
      <div className={`relative shrink-0 ${isDetail ? "h-10 w-7 sm:h-[72px] sm:w-14" : "h-11 w-8"}`}>
        <Image
          src={imageUrl}
          alt={isArabic ? `العطر المرجعي لـ ${productName}` : `Reference fragrance for ${productName}`}
          fill
          sizes={isDetail ? "(min-width: 640px) 56px, 28px" : "32px"}
          data-loaded="true"
          className="object-contain"
        />
      </div>
      <div className={`relative flex min-w-0 flex-col items-start ${isDetail ? "gap-1.5 sm:gap-2" : "gap-2"}`}>
        <span className={`whitespace-nowrap font-serif font-normal leading-none text-white/90 ${isDetail ? "text-xs sm:text-lg" : "text-[11px]"}`}>
          {isArabic ? "المرجع" : "Reference"}
        </span>
        <span aria-hidden="true" className={`h-px bg-gradient-to-r from-white/50 to-white/10 ${isDetail ? "w-5 sm:w-8" : "w-4"}`} />
      </div>
    </div>
  );
}
