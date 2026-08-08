import type { ReactNode } from "react";
import clsx from "clsx";

type BadgeProps = {
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
  children: ReactNode;
};

const badgeStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-slate-800 text-slate-200",
  success: "bg-emerald-600/10 text-emerald-300 border border-emerald-500/20",
  warning: "bg-amber-600/10 text-amber-300 border border-amber-500/20",
  danger: "bg-rose-600/10 text-rose-300 border border-rose-500/20"
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", badgeStyles[variant], className)}>{children}</span>;
}
