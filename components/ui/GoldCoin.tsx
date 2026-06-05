"use client";

// A small gold star badge used as the "coin" reward unit.
// Using ★ (solid star) with amber gold styling — clearly gold, not a grey moon coin.

interface GoldCoinProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-5 h-5 text-xs",
  md: "w-7 h-7 text-sm",
  lg: "w-9 h-9 text-base",
};

export function GoldCoin({ size = "md" }: GoldCoinProps) {
  return (
    <span
      className={`${sizes[size]} inline-flex items-center justify-center rounded-full font-black`}
      style={{
        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)",
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        boxShadow: "0 1px 4px rgba(245,158,11,0.4)",
      }}
      aria-label="gold coin"
    >
      ★
    </span>
  );
}
