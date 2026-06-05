import type { Child, DictationList, PracticeSession, MistakeEntry } from "./types";

// ─────────────────────────────────────────────
//  Realistic Singapore Primary School mock data
// ─────────────────────────────────────────────

export const MOCK_CHILDREN: Child[] = [
  {
    id: "child-1",
    name: "Xiao Ming",
    grade: "P4",
    chineseType: "Standard",
    parentId: "parent-1",
  },
  {
    id: "child-2",
    name: "Mei Ling",
    grade: "P5",
    chineseType: "Higher",
    parentId: "parent-1",
  },
];

export const MOCK_DICTATION_LISTS: DictationList[] = [
  {
    id: "list-1",
    childId: "child-1",
    title: "第五课 生词",
    dictationDate: "2026-06-10",
    reminderDate: "2026-06-08",
    createdAt: "2026-06-01T10:00:00Z",
    words: [
      { id: "w1", word: "学习", pinyin: "xué xí", meaning: "to study / to learn" },
      { id: "w2", word: "努力", pinyin: "nǔ lì", meaning: "to work hard" },
      { id: "w3", word: "认真", pinyin: "rèn zhēn", meaning: "serious / earnest" },
      { id: "w4", word: "聪明", pinyin: "cōng míng", meaning: "clever / smart" },
      { id: "w5", word: "朋友", pinyin: "péng yǒu", meaning: "friend" },
      { id: "w6", word: "快乐", pinyin: "kuài lè", meaning: "happy / joyful" },
      { id: "w7", word: "帮助", pinyin: "bāng zhù", meaning: "to help" },
      { id: "w8", word: "分享", pinyin: "fēn xiǎng", meaning: "to share" },
      { id: "w9", word: "感谢", pinyin: "gǎn xiè", meaning: "to thank / gratitude" },
      { id: "w10", word: "成功", pinyin: "chéng gōng", meaning: "success" },
    ],
  },
  {
    id: "list-2",
    childId: "child-1",
    title: "第三课 生词",
    dictationDate: "2026-05-20",
    reminderDate: "2026-05-18",
    createdAt: "2026-05-10T08:00:00Z",
    words: [
      { id: "w11", word: "家庭", pinyin: "jiā tíng", meaning: "family" },
      { id: "w12", word: "温暖", pinyin: "wēn nuǎn", meaning: "warm / warmth" },
      { id: "w13", word: "父母", pinyin: "fù mǔ", meaning: "parents" },
      { id: "w14", word: "兄弟", pinyin: "xiōng dì", meaning: "brothers" },
      { id: "w15", word: "姐妹", pinyin: "jiě mèi", meaning: "sisters" },
    ],
  },
  {
    id: "list-3",
    childId: "child-2",
    title: "第七课 华文听写",
    dictationDate: "2026-06-12",
    reminderDate: "2026-06-09",
    createdAt: "2026-06-02T09:00:00Z",
    words: [
      { id: "w16", word: "勤奋", pinyin: "qín fèn", meaning: "diligent / hardworking" },
      { id: "w17", word: "坚持", pinyin: "jiān chí", meaning: "to persist / to persevere" },
      { id: "w18", word: "进步", pinyin: "jìn bù", meaning: "progress / to improve" },
      { id: "w19", word: "毅力", pinyin: "yì lì", meaning: "willpower / perseverance" },
      { id: "w20", word: "品德", pinyin: "pǐn dé", meaning: "moral character" },
    ],
  },
];

export const MOCK_SESSIONS: PracticeSession[] = [
  {
    id: "session-1",
    dictationListId: "list-1",
    childId: "child-1",
    mode: "practice",
    startedAt: "2026-06-03T14:00:00Z",
    completedAt: "2026-06-03T14:15:00Z",
    wordResults: [
      { wordId: "w1", correct: true,  attempts: 1 },
      { wordId: "w2", correct: true,  attempts: 1 },
      { wordId: "w3", correct: false, attempts: 2 },
      { wordId: "w4", correct: true,  attempts: 1 },
      { wordId: "w5", correct: true,  attempts: 1 },
    ],
  },
];

export const MOCK_MISTAKES: MistakeEntry[] = [
  {
    wordId: "w3",
    childId: "child-1",
    word: "认真",
    pinyin: "rèn zhēn",
    meaning: "serious / earnest",
    wrongCount: 3,
    lastPracticed: "2026-06-03T14:15:00Z",
  },
  {
    wordId: "w9",
    childId: "child-1",
    word: "感谢",
    pinyin: "gǎn xiè",
    meaning: "to thank / gratitude",
    wrongCount: 2,
    lastPracticed: "2026-06-02T16:00:00Z",
  },
];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

export function getChildDictations(childId: string, allLists?: DictationList[]): DictationList[] {
  const lists = allLists ?? MOCK_DICTATION_LISTS;
  return lists.filter((d) => d.childId === childId);
}

// Takes the full list from the store so newly added dictations are included.
export function getUpcomingDictation(childId: string, allLists?: DictationList[]): DictationList | undefined {
  const lists = allLists ?? MOCK_DICTATION_LISTS;
  const today = new Date().toISOString().split("T")[0];
  return lists
    .filter((d) => d.childId === childId && d.dictationDate >= today)
    .sort((a, b) => a.dictationDate.localeCompare(b.dictationDate))[0];
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
