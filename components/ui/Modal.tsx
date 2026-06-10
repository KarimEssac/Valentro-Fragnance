"use client";

import type {ReactNode} from "react";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({isOpen, title, children, onClose}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-bg/80 px-gutter py-6 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg border border-gold bg-bg p-5 text-on-surface sm:p-8"
      >
        <div className="flex items-center justify-between gap-6">
          <h2 id="modal-title" className="font-serif text-2xl leading-tight text-parchment">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="focus-gold text-gold"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.25"
              className="h-6 w-6"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
