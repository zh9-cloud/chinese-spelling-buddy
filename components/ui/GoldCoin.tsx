"use client";

// The reward-unit icon used throughout the app: a diamond 💎.
// Rendered larger than text with a blue glow so it reads as a prize, not decoration.

interface GoldCoinProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
};

export function GoldCoin({ size = "md" }: GoldCoinProps) {
  return (
    <span
      className={`${sizes[size]} inline-flex items-center justify-center leading-none align-middle`}
      style={{ filter: "drop-shadow(0 1px 4px rgba(56,189,248,0.6))" }}
      aria-label="diamond reward"
    >
      💎
    </span>
  );
}
