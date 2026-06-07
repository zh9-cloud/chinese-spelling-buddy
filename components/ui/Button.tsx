"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

// ─────────────────────────────────────────────
//  Reusable Button
//  Large tap targets (min 48px) for children.
// ─────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-md shadow-brand-200",
  secondary:
    "bg-jade-500 hover:bg-jade-600 active:bg-jade-700 text-white shadow-md shadow-jade-200",
  ghost:
    "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200",
  danger:
    "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-md shadow-red-200",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-xl min-h-[40px]",
  md: "px-5 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-6 py-4 text-lg rounded-lg min-h-[56px] font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        "select-none touch-manipulation",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
