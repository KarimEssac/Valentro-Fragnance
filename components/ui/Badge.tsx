import type {HTMLAttributes, ReactNode} from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export default function Badge({children, className = "", ...props}: BadgeProps) {
  return (
    <span
      className={`label-caps inline-flex border border-umber px-3 py-1 text-gold ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
