"use client";

interface Props {
  pinyin?: string;
  meaning?: string;
  exampleSentence?: string;
  // text = the Chinese word/sentence, used to decide display mode
  text?: string;
}

export function PinyinMeaning({ pinyin, meaning, exampleSentence, text }: Props) {
  // For sentences (>6 chars), pinyin for the whole line is impractical — skip it
  const isSentence = (text?.length ?? 0) > 6;

  if (!pinyin && !meaning && !exampleSentence) {
    return (
      <p className="text-gray-300 text-sm text-center py-2">
        拼音和意思将在未来版本添加
      </p>
    );
  }

  return (
    <div className="space-y-1.5 text-center">
      {pinyin && (
        isSentence ? (
          // Sentence pinyin: readable but compact, wraps naturally
          <p className="text-sm leading-relaxed text-brand-400 font-medium break-words">
            {pinyin}
          </p>
        ) : (
          <p className="text-2xl text-brand-500 font-medium">{pinyin}</p>
        )
      )}
      {meaning && (
        <p className="text-base font-bold text-gray-600">{meaning}</p>
      )}
      {exampleSentence && (
        <p className="text-sm text-gray-400 italic">{exampleSentence}</p>
      )}
    </div>
  );
}
