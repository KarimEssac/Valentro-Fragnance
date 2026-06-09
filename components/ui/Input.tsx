"use client";

import type {InputHTMLAttributes} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({label, id, name, className = "", ...props}: InputProps) {
  const inputId = id ?? name;

  return (
    <label className={`block text-on-surface ${className}`} htmlFor={inputId}>
      <span className="label-caps mb-2 block text-gold">{label}</span>
      <input
        id={inputId}
        name={name}
        className="w-full border-0 border-b border-umber bg-transparent px-0 py-3 text-parchment outline-none transition-colors duration-300 placeholder:text-on-surface/45 focus:border-gold"
        {...props}
      />
    </label>
  );
}
