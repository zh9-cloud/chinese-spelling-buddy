"use client";

// ─────────────────────────────────────────────
//  WordCard — the main study card shown in Learn Mode.
//  Flip on tap to reveal pinyin + meaning.
// ─────────────────────────────────────────────

import { useState } from "react";
import type { Word } from "@/lib/types";

interface WordCardProps {
  word: Word;
  showDetails?: boolean; // controlled mode (practice/test)
}

export function WordCard({ word, showDetails }: WordCardProps) {
  const [flipped, setFlipped] = useState(false);
  const revealed = showDetails !== undefined ? showDetails : flipped;

  return (
    <div
      className="w-full rounded-3xl overflow-hidden shadow-lg cursor-pointer select-none touch-manipulation"
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-label={`Word card: ${word.word}. Tap to ${revealed ? "hide" : "reveal"} details.`}
    >
      {/* Character face */}
      <div className="bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center py-14 px-6">
        <span
          className="text-white font-bold leading-none"
          style={{ fontSize: "clamp(4rem, 20vw, 7rem)" }}
        >
          {word.word}
        </span>
      </div>

      {/* Details face */}
      <div
        className={[
          "transition-all duration-300 overflow-hidden",
          revealed ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="bg-white px-6 py-5 space-y-3">
          {word.pinyin && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                拼音 Pinyin
              </p>
              <p className="text-2xl text-brand-600 font-medium">{word.pinyin}</p>
            </div>
          )}

          {word.meaning && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                意思 Meaning
              </p>
              <p className="text-base text-gray-700">{word.meaning}</p>
            </div>
          )}

          {word.exampleSentence && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                例句 Example
              </p>
              <p className="text-base text-gray-600 italic">{word.exampleSentence}</p>
            </div>
          )}

          {/* Placeholder notice when optional fields are empty */}
          {!word.pinyin && !word.meaning && (
            <p className="text-gray-400 text-sm text-center py-2">
              拼音和意思将在未来版本添加
            </p>
          )}
        </div>
      </div>

      {/* Tap hint */}
      {!revealed && (
        <div className="bg-white px-6 py-3 text-center text-sm text-gray-400">
          点击查看拼音和意思 👆
        </div>
      )}
    </div>
  );
}
