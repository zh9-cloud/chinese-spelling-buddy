// 水墨分隔线 — a tapered brush-stroke divider with a soft ink-wash gradient.
// Use between sections for a calligraphic touch. `tone` picks ink or cinnabar.

export function InkDivider({
  tone = "ink",
  className = "",
}: {
  tone?: "ink" | "cinnabar";
  className?: string;
}) {
  const color = tone === "cinnabar" ? "#b83b2e" : "#3a3a3a";
  return (
    <svg
      viewBox="0 0 320 16" className={`w-full h-3 ink-sweep ${className}`}
      preserveAspectRatio="none" aria-hidden="true"
    >
      <defs>
        <linearGradient id={`ink-${tone}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="12%" stopColor={color} stopOpacity="0.55" />
          <stop offset="50%" stopColor={color} stopOpacity="0.9" />
          <stop offset="88%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Slightly wavy brush stroke that thickens in the middle */}
      <path
        d="M4 9 C 60 4, 110 13, 160 8 S 270 5, 316 9 C 270 11, 110 14, 4 9 Z"
        fill={`url(#ink-${tone})`}
      />
    </svg>
  );
}
