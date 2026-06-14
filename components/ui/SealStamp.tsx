// 印章 — a cinnabar seal stamp for reward moments ("优" / "棒" / "赞").
// Renders with a stamp-down animation (.seal-stamp). Drop it onto a results
// or celebration screen.

import { KAI_STACK } from "@/components/student/MiZiGe";

export function SealStamp({
  text = "优",
  size = 88,
  className = "",
}: {
  text?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`seal-stamp inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={`印章 ${text}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* weathered cinnabar block */}
        <rect x="6" y="6" width="88" height="88" rx="12" fill="#b83b2e" />
        {/* inner keyline */}
        <rect x="13" y="13" width="74" height="74" rx="8" fill="none" stroke="#fdeee9" strokeWidth="2.4" opacity="0.85" />
        {/* the seal character(s) */}
        <text
          x="50" y="54" textAnchor="middle" dominantBaseline="central"
          fill="#fdeee9"
          fontSize={text.length > 1 ? 36 : 56}
          style={{ fontFamily: KAI_STACK, fontWeight: 700 }}
        >
          {text}
        </text>
      </svg>
    </div>
  );
}
