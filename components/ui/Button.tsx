"use client";

import type {ButtonHTMLAttributes} from "react";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-bg border border-gold hover:bg-parchment hover:border-parchment",
  ghost:
    "bg-transparent text-gold border border-gold hover:bg-gold hover:text-bg",
  danger:
    "bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab] hover:bg-[#690005]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base"
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`focus-gold font-sans font-semibold uppercase tracking-widest transition duration-300 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
