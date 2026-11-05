"use client";

import Image from "next/image";
import type {ChangeEvent} from "react";
import {useEffect, useId, useRef, useState} from "react";

type ReferenceImageFieldProps = {
  currentImageUrl?: string | null;
  productName?: string;
};

export default function ReferenceImageField({
  currentImageUrl,
  productName = "this fragrance"
}: ReferenceImageFieldProps) {
  const inputId = useId();
  const previewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeReference, setRemoveReference] = useState(false);
  const displayedImage = removeReference ? null : previewUrl ?? currentImageUrl;

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function selectReference(event: ChangeEvent<HTMLInputElement>) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const file = event.target.files?.[0];
    const nextPreview = file ? URL.createObjectURL(file) : null;
    previewRef.current = nextPreview;
    setPreviewUrl(nextPreview);
    setRemoveReference(false);
  }

  return (
    <fieldset className="space-y-4 border border-outline/60 bg-surface/40 p-4">
      <legend className="label-caps px-2 text-gold">Inspiration Image (Optional)</legend>
      <p id={`${inputId}-help`} className="text-xs leading-5 text-on-surface/70">
        Upload the original fragrance used as inspiration. It appears as a small
        inspiration badge inside the product image. Images up to 5MB.
      </p>
      {displayedImage ? (
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden border border-outline/60 bg-surface-hi">
            <Image
              src={displayedImage}
              alt={`Fragrance inspiration for ${productName}`}
              fill
              unoptimized={Boolean(previewUrl)}
              sizes="64px"
              className="object-contain"
            />
          </div>
          <span className="text-xs text-on-surface/70">
            {previewUrl ? "New inspiration preview" : "Current inspiration"}
          </span>
        </div>
      ) : null}
      <label htmlFor={inputId} className="label-caps block text-gold">
        {currentImageUrl ? "Replace inspiration image" : "Upload inspiration image"}
      </label>
      <input
        id={inputId}
        name="referenceImage"
        type="file"
        accept="image/*"
        aria-describedby={`${inputId}-help`}
        disabled={removeReference}
        onChange={selectReference}
        className="w-full text-sm text-on-surface/80 file:mr-4 file:border file:border-parchment file:bg-transparent file:px-4 file:py-2 file:text-parchment disabled:opacity-50"
      />
      {currentImageUrl ? (
        <label className="label-caps flex items-center gap-2 text-on-surface/80">
          <input
            name="removeReferenceImage"
            type="checkbox"
            value="true"
            checked={removeReference}
            onChange={(event) => setRemoveReference(event.target.checked)}
          />
          Remove inspiration image
        </label>
      ) : null}
    </fieldset>
  );
}
