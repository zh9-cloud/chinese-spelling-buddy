"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface ModeButtonProps {
  href: string;
  icon: ReactNode;
  label: string;
  accentColor: string;
  iconColor: string;
  disabled?: boolean;
  /** "lg" = tall (Learn/Test), "sm" = half-height (Mistakes) */
  size?: "lg" | "sm";
}

export function ModeButton({
  href,
  icon,
  label,
  accentColor,
  iconColor,
  disabled = false,
  size = "lg",
}: ModeButtonProps) {
  const padding   = size === "lg" ? "py-5 px-4"   : "py-2.5 px-4";
  const iconSize  = size === "lg" ? "w-10 h-10"   : "w-7 h-7";
  const iconRound = size === "lg" ? "rounded-xl"  : "rounded-lg";
  const textSize  = size === "lg" ? "text-base"   : "text-sm";

  const inner = (
    <div className={[
      `flex items-center gap-3 rounded-2xl ${padding} transition-all duration-150`,
      "border border-gray-100 bg-white shadow-sm",
      disabled
        ? "opacity-40 cursor-not-allowed"
        : "hover:shadow-md active:scale-[0.97] cursor-pointer",
    ].join(" ")}>
      <div className={`${iconSize} ${iconRound} flex items-center justify-center shrink-0 ${accentColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <span className={`font-black ${textSize} text-gray-800 tracking-wide`}>{label}</span>
      {!disabled && (
        <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (disabled) return inner;
  return <Link href={href}>{inner}</Link>;
}

// ── Preset icons ────────────────────────────────────────────────────────────

export function IconLearn() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

export function IconTest() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

export function IconMistakes() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="13" x2="12" y2="13"/>
    </svg>
  );
}
