// ─────────────────────────────────────────────────────────────────────────────
//  Starter word lists for a newly added child.
//
//  A freshly signed-up parent used to land in a completely empty app: no lists,
//  so Learn / Test / AI grading were all unreachable and there was nothing to
//  show what the app does. Every new child now gets two sample lists, pitched at
//  their grade, dated in the near future so they appear under 下一次听写.
//
//  Titles are prefixed 示例 (sample) so it's obvious they can be deleted.
// ─────────────────────────────────────────────────────────────────────────────

import type { Child, DictationList, Word } from "@/lib/types";

type Row = [word: string, pinyin: string, meaning: string];

// Three difficulty bands. Each band has two lists of ten words, and every list
// ends with a 四字成语 so the 2x2 米字格 layout shows up straight away.
const BANDS: Record<"lower" | "middle" | "upper", [Row[], Row[]]> = {
  // P1–P2
  lower: [
    [
      ["爸爸", "bà ba", "father"], ["妈妈", "mā ma", "mother"],
      ["学校", "xué xiào", "school"], ["老师", "lǎo shī", "teacher"],
      ["同学", "tóng xué", "classmate"], ["朋友", "péng yǒu", "friend"],
      ["快乐", "kuài lè", "happy"], ["回家", "huí jiā", "go home"],
      ["读书", "dú shū", "to read"], ["天天向上", "tiān tiān xiàng shàng", "improve every day"],
    ],
    [
      ["早上", "zǎo shang", "morning"], ["晚上", "wǎn shang", "evening"],
      ["吃饭", "chī fàn", "to eat"], ["喝水", "hē shuǐ", "drink water"],
      ["下雨", "xià yǔ", "to rain"], ["天气", "tiān qì", "weather"],
      ["公园", "gōng yuán", "park"], ["生日", "shēng rì", "birthday"],
      ["高兴", "gāo xìng", "glad"], ["一心一意", "yì xīn yí yì", "wholeheartedly"],
    ],
  ],
  // P3–P4
  middle: [
    [
      ["学习", "xué xí", "study / learning"], ["努力", "nǔ lì", "to work hard"],
      ["认真", "rèn zhēn", "serious / earnest"], ["聪明", "cōng míng", "clever"],
      ["帮助", "bāng zhù", "to help"], ["分享", "fēn xiǎng", "to share"],
      ["感谢", "gǎn xiè", "to thank"], ["习惯", "xí guàn", "habit"],
      ["整齐", "zhěng qí", "neat / tidy"], ["勤学好问", "qín xué hǎo wèn", "diligent and inquisitive"],
    ],
    [
      ["安静", "ān jìng", "quiet"], ["勇敢", "yǒng gǎn", "brave"],
      ["诚实", "chéng shí", "honest"], ["礼貌", "lǐ mào", "polite"],
      ["合作", "hé zuò", "cooperate"], ["进步", "jìn bù", "progress"],
      ["选择", "xuǎn zé", "to choose"], ["观察", "guān chá", "to observe"],
      ["丰富", "fēng fù", "rich / abundant"], ["专心致志", "zhuān xīn zhì zhì", "fully focused"],
    ],
  ],
  // P5–P6
  upper: [
    [
      ["坚持", "jiān chí", "persist"], ["责任", "zé rèn", "responsibility"],
      ["独立", "dú lì", "independent"], ["鼓励", "gǔ lì", "to encourage"],
      ["挑战", "tiǎo zhàn", "challenge"], ["珍惜", "zhēn xī", "to cherish"],
      ["团结", "tuán jié", "unity"], ["骄傲", "jiāo ào", "proud"],
      ["谦虚", "qiān xū", "modest"], ["全力以赴", "quán lì yǐ fù", "go all out"],
    ],
    [
      ["理解", "lǐ jiě", "to understand"], ["尊重", "zūn zhòng", "to respect"],
      ["贡献", "gòng xiàn", "contribution"], ["克服", "kè fú", "to overcome"],
      ["经验", "jīng yàn", "experience"], ["判断", "pàn duàn", "to judge"],
      ["灵活", "líng huó", "flexible"],
      ["严格", "yán gé", "strict"], ["改进", "gǎi jìn", "to improve"],
      ["持之以恒", "chí zhī yǐ héng", "persevere consistently"],
    ],
  ],
};

function bandFor(grade: string): keyof typeof BANDS {
  if (/P1|P2/i.test(grade)) return "lower";
  if (/P5|P6/i.test(grade)) return "upper";
  return "middle"; // P3, P4 and 其他
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Two starter lists for a child. `newId` comes from the store so ids match the
 * app's own scheme.
 */
export function makeSampleLists(child: Child, newId: () => string): DictationList[] {
  const [first, second] = BANDS[bandFor(child.grade)];
  const now = new Date().toISOString();

  return [
    { rows: first, title: "示例：第一课 生词", inDays: 5 },
    { rows: second, title: "示例：第二课 生词", inDays: 12 },
  ].map(({ rows, title, inDays }) => {
    const dictationDate = isoDaysFromNow(inDays);
    const words: Word[] = rows.map(([word, pinyin, meaning]) => ({
      id: newId(), word, pinyin, meaning,
    }));
    return {
      id: newId(),
      childId: child.id,
      title,
      dictationDate,
      // Weekend-before reminder, same convention the app uses elsewhere.
      reminderDate: isoDaysFromNow(Math.max(0, inDays - 2)),
      createdAt: now,
      words,
    };
  });
}
