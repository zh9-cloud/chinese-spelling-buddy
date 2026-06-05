"use client";

// ─────────────────────────────────────────────
//  AppShell — wraps every page with a top nav bar
//  and constrains max-width to a phone-like column
//  even on wide screens.
// ─────────────────────────────────────────────

import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  backHref?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  /** Removes default page padding — useful for full-bleed hero sections */
  noPadding?: boolean;
}

export function AppShell({
  title,
  backHref,
  rightSlot,
  children,
  noPadding = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top nav bar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors -ml-1 px-1 py-1 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">返回 Back</span>
            </Link>
          ) : (
            <div className="w-12" />
          )}

          <h1 className="text-base font-bold text-gray-800 text-center flex-1 px-2 truncate">
            {title}
          </h1>

          <div className="w-12 flex justify-end">{rightSlot}</div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main
        className={[
          "flex-1 max-w-md mx-auto w-full",
          noPadding ? "" : "px-4 py-5",
        ].join(" ")}
      >
        {children}
      </main>

      {/* ── Bottom safe area for iOS home bar ── */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
