// ─────────────────────────────────────────────────────────────────────────────
//  米字格 (rice-grid) writing cell — gives young learners the standard
//  character-framing used in Chinese handwriting practice.
//
//  Paper-toned tile + cinnabar (朱砂) border, dashed centre cross + diagonals,
//  and the character itself drawn as SVG <text> so it scales perfectly with the
//  cell. The character uses a 楷体 (regular-script) font stack for a calligraphic,
//  textbook-handwriting feel.
// ─────────────────────────────────────────────────────────────────────────────

// 楷体 stack — web font 霞鹜文楷 first (loaded in layout, chunked by unicode-range),
// then platform 楷体 (Apple has STKaiti), finally serif. Consistent kai everywhere.
export const KAI_STACK =
  "'LXGW WenKai GB Screen','Kaiti SC','STKaiti','KaiTi','TW-Kai','Noto Serif CJK SC','Songti SC',serif";

export function MiZiGe({ char }: { char?: string }) {
  return (
    <div className="relative flex-1 aspect-square max-w-[8.5rem]" style={{ containerType: "inline-size" }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18))" }}>
        {/* xuan-paper tile */}
        <rect x="3" y="3" width="94" height="94" rx="5" fill="#fdfaf4" />
        {/* dashed centre cross + diagonals (米 pattern) */}
        <g stroke="#e0a89f" strokeWidth="1" strokeDasharray="4 3">
          <line x1="50" y1="4" x2="50" y2="96" />
          <line x1="4" y1="50" x2="96" y2="50" />
          <line x1="7" y1="7" x2="93" y2="93" />
          <line x1="93" y1="7" x2="7" y2="93" />
        </g>
        {/* cinnabar frame */}
        <rect x="3" y="3" width="94" height="94" rx="5" fill="none" stroke="#b83b2e" strokeWidth="2.5" />
      </svg>
      {/* Character as HTML text (omitted for blank writing cells) — uses the
          same web 楷体 / weight as sentences, so strokes match (no faux bold).
          Sized in cqw so it scales with the cell. */}
      {char && (
        <span
          className="absolute inset-0 flex items-center justify-center cjk select-none"
          style={{ fontFamily: KAI_STACK, fontWeight: 400, color: "#2a2622", fontSize: "60cqw", lineHeight: 1 }}
        >
          {char}
        </span>
      )}
    </div>
  );
}

/**
 * A centred row of 米字格 cells. Pass `word` for filled cells (Learn mode),
 * or `blanks` for empty writing cells (Test mode — frame only, no answer).
 */
export function MiZiGeRow({ word, blanks }: { word?: string; blanks?: number }) {
  const cells = word != null ? Array.from(word).map((c) => c) : Array.from({ length: blanks ?? 0 }, () => undefined);

  // 4-character words: lay out 2 over 2 so each 米字格 (and its character) is
  // twice as large — much easier to read for P1–P3. 1/2/3-char words stay in
  // one row. Applies to both Learn (filled) and Test (blank) cells.
  if (cells.length === 4) {
    return (
      <div className="flex flex-col items-center gap-3 w-full px-2 max-w-[20rem] mx-auto">
        {[cells.slice(0, 2), cells.slice(2, 4)].map((pair, r) => (
          <div key={r} className="flex justify-center gap-3 w-full">
            {pair.map((c, i) => (
              <MiZiGe key={i} char={c} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 w-full px-2">
      {cells.map((c, i) => (
        <MiZiGe key={i} char={c} />
      ))}
    </div>
  );
}
