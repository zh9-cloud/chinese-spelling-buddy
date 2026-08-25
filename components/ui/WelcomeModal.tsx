"use client";

// First-run welcome card. Shows a short, skippable 3-step intro the first time
// a parent / child opens their dashboard, then never again (remembered in
// localStorage under `storageKey`). Renders nothing on the server / once seen,
// so there is no hydration flash.

import { useEffect, useState } from "react";

interface Props {
  storageKey: string;
  title: string;
  steps: string[];
  buttonText?: string;
  /**
   * Show even if this device dismissed the card before. Pass true while the
   * account is still empty: a parent who signs up on a device that already ran
   * the trial would otherwise never see the guide, which is exactly when they
   * need it (and what an App Store reviewer lands in).
   */
  forceShow?: boolean;
}

export function WelcomeModal({ storageKey, title, steps, buttonText = "开始 Start", forceShow }: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (forceShow || localStorage.getItem(storageKey) !== "1") setShow(true);
    } catch { /* ignore */ }
  }, [storageKey, forceShow]);

  function dismiss() {
    try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
    setDismissed(true);
    setShow(false);
  }

  if (!show || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/40"
      role="dialog" aria-modal="true"
    >
      {/* Dismiss only via the button — a backdrop tap would otherwise be
          triggered by the very click that navigated here, closing it instantly. */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 page-enter">
        <h2 className="calligraphy text-2xl font-black text-gray-800 text-center mb-5">{title}</h2>
        <ol className="space-y-3.5 mb-6">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-brand-500 text-white font-black flex items-center justify-center text-sm">{i + 1}</span>
              <span className="text-base text-gray-700 leading-snug pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={dismiss}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl py-3.5 active:scale-95 transition-all shadow-lg shadow-brand-200"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
