import type {ReactNode} from "react";

export interface AdminShellProps {
  title: string;
  children?: ReactNode;
}

export default function AdminShell({title, children}: AdminShellProps) {
  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-parchment">{title}</h1>
      <div className="border border-umber bg-surface p-6 text-on-surface">
        {/* TODO: Replace admin shell placeholder with production admin views. */}
        {children}
      </div>
    </section>
  );
}
