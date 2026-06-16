import type {ReactNode} from "react";

export interface AdminShellProps {
  title: string;
  children?: ReactNode;
}

export default function AdminShell({title, children}: AdminShellProps) {
  return (
    <section className="mx-auto max-w-container space-y-6 px-gutter py-10 sm:py-12 lg:px-16">
      <h1 className="font-serif text-3xl leading-tight text-parchment sm:text-4xl">
        {title}
      </h1>
      <div className="border border-outline/60 bg-surface/70 p-5 text-on-surface sm:p-6">
        {/* TODO: Replace admin shell placeholder with production admin views. */}
        {children}
      </div>
    </section>
  );
}
