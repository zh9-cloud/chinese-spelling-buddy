// ─────────────────────────────────────────────
//  Core domain types
//  All future Supabase tables will mirror these shapes exactly.
// ─────────────────────────────────────────────

export type Grade = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "其他";
export type ChineseType = "Standard" | "Higher" | "Foundation";

export interface Child {
  id: string;
  name: string;
  grade: Grade;
  chineseType: ChineseType;
  parentId: string;
}

export interface Word {
  id: string;
  word: string;           // The Chinese character(s), e.g. "学习"
  pinyin?: string;        // e.g. "xué xí"   — optional for MVP
  meaning?: string;       // English meaning  — optional for MVP
  exampleSentence?: string; // — optional for MVP
  /** True when this item is a full sentence to be dictated as-is */
  isSentence?: boolean;
}

export interface DictationList {
  id: string;
  childId: string;
  title: string;
  dictationDate: string;  // ISO date string "YYYY-MM-DD"
  reminderDate: string;   // ISO date string
  words: Word[];
  createdAt: string;      // ISO datetime
}

// ─────────────────────────────────────────────
//  Practice session — stored locally per session
// ─────────────────────────────────────────────

export type SessionMode = "learn" | "practice" | "test" | "handwriting";

export interface PracticeSession {
  id: string;
  dictationListId: string;
  childId: string;
  mode: SessionMode;
  startedAt: string;
  completedAt?: string;
  wordResults: WordResult[];
}

export interface WordResult {
  wordId: string;
  correct: boolean;       // used in test mode
  attempts: number;
}

// ─────────────────────────────────────────────
//  Mistake book — aggregated wrong answers
// ─────────────────────────────────────────────

export interface MistakeEntry {
  wordId: string;
  childId: string;
  word: string;
  pinyin?: string;
  meaning?: string;
  wrongCount: number;
  lastPracticed: string;
}

// ─────────────────────────────────────────────
//  LocalStorage store shape
//  When we add Supabase these become DB rows.
// ─────────────────────────────────────────────

export interface AppStore {
  children: Child[];
  dictationLists: DictationList[];
  sessions: PracticeSession[];
  mistakes: MistakeEntry[];
}
