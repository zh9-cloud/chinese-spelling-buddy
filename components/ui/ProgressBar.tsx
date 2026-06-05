"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  color?: "orange" | "green" | "blue";
  showLabel?: boolean;
}

const colorClasses = {
  orange: "bg-brand-500",
  green:  "bg-jade-500",
  blue:   "bg-sky-500",
};

export function ProgressBar({
  current,
  total,
  color = "green",
  showLabel = true,
}: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            <strong className="text-gray-700">{current}</strong>
            {" / "}
            <strong className="text-gray-700">{total}</strong>
            {" 个字"}
          </span>
          <span><strong className="text-gray-700">{pct}</strong>%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`${colorClasses[color]} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
