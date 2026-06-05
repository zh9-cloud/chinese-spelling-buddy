"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: "orange" | "green" | "blue" | "red" | "purple" | "none";
  padded?: boolean;
}

const accentClasses: Record<NonNullable<CardProps["accent"]>, string> = {
  orange: "border-l-4 border-brand-400",
  green:  "border-l-4 border-jade-400",
  blue:   "border-l-4 border-sky-400",
  red:    "border-l-4 border-red-400",
  purple: "border-l-4 border-purple-400",
  none:   "",
};

export function Card({
  children,
  className = "",
  onClick,
  accent = "none",
  padded = true,
}: CardProps) {
  const interactive = onClick
    ? "cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-150"
    : "";

  return (
    <div
      className={[
        "bg-white rounded-2xl shadow-sm border border-gray-100",
        padded ? "p-4" : "",
        accentClasses[accent],
        interactive,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
