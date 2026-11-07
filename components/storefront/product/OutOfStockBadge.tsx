export default function OutOfStockBadge({isArabic}: {isArabic: boolean}) {
  return (
    <span className="label-caps pointer-events-none absolute bottom-2 right-2 z-30 border border-outline bg-surface px-2 py-1.5 text-parchment sm:bottom-3 sm:right-3">
      {isArabic ? "نفد المخزون" : "Out of stock"}
    </span>
  );
}
