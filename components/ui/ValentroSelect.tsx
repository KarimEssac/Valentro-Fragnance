import type {ComponentProps} from "react";

type ValentroSelectProps = ComponentProps<"select"> & {
  wrapperClassName?: string;
};

export default function ValentroSelect({
  className = "",
  wrapperClassName = "",
  children,
  ...props
}: ValentroSelectProps) {
  return (
    <div className={`relative w-full ${wrapperClassName}`}>
      <select
        {...props}
        className={`label-caps min-h-10 w-full cursor-pointer appearance-none border border-outline bg-surface py-2 pl-4 pr-12 text-left text-parchment outline-none transition-colors focus:border-gold disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gold"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </span>
    </div>
  );
}
