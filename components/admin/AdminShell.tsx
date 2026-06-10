import type {ReactNode} from "react";

export interface AdminShellProps {
  title: string;
  children?: ReactNode;
}

export default function AdminShell({title, children}: AdminShellProps) {
  return (
    <section className="space-y-6">
      <h1 className="font-serif text-3xl leading-tight text-parchment sm:text-4xl">{title}</h1>
      <div className="border border-umber bg-surface p-5 text-on-surface sm:p-6">
        {/* TODO: Replace admin shell placeholder with production admin views. */}
        {children}
      </div>
    </section>
  );
}
