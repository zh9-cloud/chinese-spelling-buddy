"use client";

import type { ReactNode } from "react";

type BadgeVariant = "orange" | "green" | "blue" | "red" | "purple" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  orange: "bg-brand-100 text-brand-700",
  green:  "bg-jade-100 text-jade-700",
  blue:   "bg-sky-100 text-sky-700",
  red:    "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
  gray:   "bg-gray-100 text-gray-600",
};

export function Badge({ variant = "gray", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
