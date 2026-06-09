import type {HTMLAttributes} from "react";

export interface ScaleIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  max?: number;
}

export default function ScaleIndicator({
  label,
  value,
  max = 6,
  className = "",
  ...props
}: ScaleIndicatorProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percent = max === 0 ? 0 : (clampedValue / max) * 100;

  return (
    <div className={`flex items-center gap-4 ${className}`} {...props}>
      <div className="relative h-20 w-px bg-umber">
        <span
          className="absolute bottom-0 start-1/2 w-px -translate-x-1/2 bg-gold"
          style={{height: `${percent}%`}}
        />
      </div>
      <div>
        <p className="label-caps text-gold">{label}</p>
        <p className="mt-1 text-sm text-on-surface">
          {clampedValue}/{max}
        </p>
      </div>
    </div>
  );
}
