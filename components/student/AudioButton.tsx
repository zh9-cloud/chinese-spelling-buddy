"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AudioButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  playTrigger?: number;
}

const sizeClasses = {
  sm: "w-9  h-9  text-lg",
  md: "w-11 h-11 text-xl",
  lg: "w-16 h-16 text-3xl",
};

const PREFERRED_WEB_VOICES = ["Ting-Ting", "Mei-Jia", "Yu-shu", "Sin-Ji"];

export function AudioButton({ text, size = "md", playTrigger = 0 }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const webVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load best available Web Speech voice (used as fallback)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      for (const name of PREFERRED_WEB_VOICES) {
        const v = voices.find((v) => v.name.includes(name));
        if (v) { webVoiceRef.current = v; return; }
      }
      webVoiceRef.current =
        voices.find((v) => v.lang === "zh-CN") ??
        voices.find((v) => v.lang.startsWith("zh")) ??
        null;
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // Stop whatever is playing
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  // Web Speech API fallback
  const speakFallback = useCallback((t: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPlaying(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(t);
    if (webVoiceRef.current) u.voice = webVoiceRef.current;
    u.lang  = webVoiceRef.current?.lang ?? "zh-CN";
    u.rate  = 0.85;
    u.pitch = 1;
    u.onend   = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(u);
  }, []);

  // Main speak function — tries Google TTS first, falls back to Web Speech
  const speak = useCallback((t: string) => {
    stop();
    setPlaying(true);

    const audio = new Audio(`/api/tts?text=${encodeURIComponent(t)}`);
    audio.onended  = () => setPlaying(false);
    audio.onerror  = () => {
      // Google TTS unavailable (no key or network) → fall back
      audio.onended = null;
      audioRef.current = null;
      speakFallback(t);
    };

    audioRef.current = audio;
    audio.play().catch(() => {
      audioRef.current = null;
      speakFallback(t);
    });
  }, [stop, speakFallback]);

  // Auto-play 500 ms after playTrigger changes (navigation)
  useEffect(() => {
    if (playTrigger === 0) return;
    const timer = setTimeout(() => speak(text), 500);
    return () => clearTimeout(timer);
  }, [playTrigger, text, speak]);

  function handleClick() {
    if (playing) { stop(); return; }
    speak(text);
  }

  return (
    <button
      onClick={handleClick}
      className={[
        sizeClasses[size],
        "rounded-full flex items-center justify-center shrink-0",
        "transition-all duration-150 focus:outline-none touch-manipulation",
        playing
          ? "bg-white/40 shadow-md scale-110"
          : "bg-white/30 hover:bg-white/50 active:scale-95",
      ].join(" ")}
      aria-label={playing ? "停止" : `朗读 ${text}`}
    >
      <SpeakerIcon playing={playing} size={size} />
    </button>
  );
}

function SpeakerIcon({ playing, size }: { playing: boolean; size: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 36 : size === "md" ? 26 : 20;
  return (
    <svg width={dim} height={dim} viewBox="0 0 40 40" fill="none"
      className={playing ? "wiggle" : ""} aria-hidden>
      <rect x="3" y="14" width="10" height="12" rx="3" fill="white" />
      <path d="M13 11 L24 5 Q26 4 26 6 L26 34 Q26 36 24 35 L13 29 Z" fill="white" />
      {playing ? <>
        <path d="M29 14 Q34 20 29 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9"/>
        <path d="M32 10 Q40 20 32 30" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
      </> : <>
        <path d="M29 15 Q33 20 29 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M32 11 Q38 20 32 29" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35"/>
      </>}
    </svg>
  );
}
