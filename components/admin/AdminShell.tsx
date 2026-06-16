import type {ReactNode} from "react";

export interface AdminShellProps {
  title: string;
  children?: ReactNode;
  fullWidth?: boolean;
  framed?: boolean;
  showTitle?: boolean;
}

export default function AdminShell({
  title,
  children,
  fullWidth = false,
  framed = true,
  showTitle = true
}: AdminShellProps) {
  return (
    <section
      className={`mx-auto space-y-6 px-gutter py-10 sm:py-12 lg:px-16 ${
        fullWidth ? "max-w-none" : "max-w-container"
      }`}
    >
      {showTitle ? (
        <h1 className="font-serif text-3xl leading-tight text-parchment sm:text-4xl">
          {title}
        </h1>
      ) : null}
      <div
        className={
          framed
            ? "border border-outline/60 bg-surface/70 p-5 text-on-surface sm:p-6"
            : "text-on-surface"
        }
      >
        {children}
      </div>
    </section>
  );
}
