// Premium app icon — SVG-drawn, no emoji.
// Deep indigo background · gold 文 character · subtle sound arc.

export function AppIcon({ size = 112 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 112 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Chinese Spelling Buddy icon"
    >
      <defs>
        {/* Background — deep indigo to rich navy */}
        <linearGradient id="iconBg" x1="0" y1="0" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>

        {/* Gold character gradient */}
        <linearGradient id="gold" x1="28" y1="18" x2="84" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="55%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Subtle inner glow */}
        <radialGradient id="glow" cx="50%" cy="38%" r="52%">
          <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
        </radialGradient>

        <clipPath id="rounded">
          <rect width="112" height="112" rx="26" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="112" height="112" rx="26" fill="url(#iconBg)" />
      <rect width="112" height="112" rx="26" fill="url(#glow)" />

      {/* Subtle grid lines — like notebook paper, very faint */}
      <line x1="0" y1="90" x2="112" y2="90" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
      <line x1="0" y1="75" x2="112" y2="75" stroke="white" strokeOpacity="0.04" strokeWidth="1" />

      {/*
        Character 文 (wén) — culture, writing, language.
        Hand-traced as SVG paths for crisp rendering at all sizes.
        Based on a bold Kaishu stroke structure.
      */}

      {/* Top dot stroke */}
      <path
        d="M56 16 C55 18, 54.5 20, 55 22 C55.5 24, 57 24.5, 57.5 22.5 C58 20.5, 57.5 18, 56 16Z"
        fill="url(#gold)"
      />

      {/* Horizontal crossbar */}
      <path
        d="M30 33 Q56 29 82 33 Q80 36 56 34 Q32 36 30 33Z"
        fill="url(#gold)"
      />

      {/* Left-falling diagonal stroke */}
      <path
        d="M56 34 Q48 46 32 66 Q30 69 31 71 Q32.5 72 34 70 Q50 50 58 36Z"
        fill="url(#gold)"
      />

      {/* Right-falling diagonal stroke */}
      <path
        d="M56 34 Q64 46 80 66 Q82 69 81 71 Q79.5 72.5 78 70.5 Q62 50 54 36Z"
        fill="url(#gold)"
      />

      {/* Bottom sweeping stroke (撇 + 捺 base) */}
      <path
        d="M38 56 Q56 52 74 56 Q68 65 56 72 Q44 65 38 56Z"
        fill="url(#gold)"
        opacity="0.9"
      />

      {/* Sound-wave arcs — three concentric thin arcs below the character */}
      <path d="M43 84 Q56 79 69 84" stroke="url(#gold)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M36 90 Q56 83 76 90" stroke="url(#gold)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.35" />
      <path d="M29 96 Q56 87 83 96" stroke="url(#gold)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.18" />

      {/* Shine highlight — top-left gloss */}
      <ellipse cx="34" cy="28" rx="18" ry="10" fill="white" opacity="0.06" transform="rotate(-20 34 28)" />
    </svg>
  );
}
