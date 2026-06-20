import type { ReactNode } from "react";

// Larger explanatory text for young students (P1–P6). The .kid-text class
// (see app/globals.css) bumps the small utility font sizes on all /student
// pages — labels, pinyin, meanings, hints, button sub-text. The big word
// cards use inline font-size, so they stay exactly as large as before.
export default function StudentLayout({ children }: { children: ReactNode }) {
  return <div className="kid-text">{children}</div>;
}
