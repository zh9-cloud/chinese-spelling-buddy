// ─────────────────────────────────────────────────────────────────────────────
//  Sound + haptic feedback for young learners (P1–P3).
//
//  Sounds are SYNTHESIZED with the Web Audio API — no audio files to load. A
//  light "tick" on navigation, a happy two-note "ding" when a word is correct,
//  and a little four-note chime on completion. Vibration uses navigator.vibrate
//  (works on Android web + the Capacitor Android shell; iOS web has no vibration
//  API, so sound carries it there — the future native iOS app can add haptics).
//
//  Respects a localStorage on/off switch (default ON), toggled in Settings.
//  Every call is wrapped so it can never throw into the UI.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "sb_feedback";

/** Feedback is on unless the user explicitly turned it off. */
export function isFeedbackOn(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setFeedbackOn(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Play one or more short tones at the given times (seconds from now). */
function tones(notes: Array<[freq: number, at: number]>, type: OscillatorType, gain: number, dur: number) {
  const ac = audio();
  if (!ac) return;
  for (const [freq, at] of notes) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = ac.currentTime + at;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

/** Light tick — page navigation (←/→). */
export function feedbackTap(): void {
  if (!isFeedbackOn()) return;
  tones([[620, 0]], "triangle", 0.07, 0.07);
  vibrate(8);
}

/** Happy rising "ding" — a word answered correctly (会了). */
export function feedbackCorrect(): void {
  if (!isFeedbackOn()) return;
  tones([[660, 0], [988, 0.085]], "sine", 0.16, 0.13);
  vibrate(16);
}

/** Soft low blip — answer revealed (不会), neutral, not discouraging. */
export function feedbackReveal(): void {
  if (!isFeedbackOn()) return;
  tones([[330, 0]], "sine", 0.1, 0.12);
  vibrate(12);
}

/** Celebration chime — Learn/Test finished. */
export function feedbackFinish(): void {
  if (!isFeedbackOn()) return;
  tones([[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]], "sine", 0.18, 0.22);
  vibrate([0, 25, 45, 25]);
}

/** A few reusable encouragement phrases shown on completion. */
export const PRAISES = ["太棒了！", "真厉害！", "继续加油！", "你真用心！", "越来越好啦！", "好样的！"];

export function randomPraise(): string {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
}
