import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-soft", className)}>
      {children}
    </div>
  );
}
