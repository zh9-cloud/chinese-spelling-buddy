"use client";

// ─────────────────────────────────────────────
//  LocalStorage persistence layer
//
//  Why a dedicated module?
//  All data reads/writes go through here. When we
//  swap to Supabase we only change this one file —
//  every page/component stays the same.
// ─────────────────────────────────────────────

import type { AppStore, DictationList, PracticeSession, MistakeEntry } from "./types";
import {
  MOCK_CHILDREN,
  MOCK_DICTATION_LISTS,
  MOCK_SESSIONS,
  MOCK_MISTAKES,
} from "./mockData";

const STORAGE_KEY = "cdb_store_v1";

function defaultStore(): AppStore {
  return {
    children: MOCK_CHILDREN,
    dictationLists: MOCK_DICTATION_LISTS,
    sessions: MOCK_SESSIONS,
    mistakes: MOCK_MISTAKES,
  };
}

export function loadStore(): AppStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    return JSON.parse(raw) as AppStore;
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: AppStore): void {
  if (typeof window === "undefined") return;
  // Preserve the `coins` field (kept alongside the store but not part of AppStore),
  // otherwise saving a session/mistake would wipe a child's coin balance.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? (JSON.parse(raw) as { coins?: Record<string, number> }) : {};
    const merged = { ...store, coins: prev.coins ?? {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

// ── Children ────────────────────────────────

export function saveChildren(children: import("./types").Child[]): void {
  const store = loadStore();
  store.children = children;
  saveStore(store);
}

// ── Dictation CRUD ──────────────────────────

export function addDictationList(list: DictationList): void {
  const store = loadStore();
  store.dictationLists.push(list);
  saveStore(store);
}

export function updateDictationList(updated: DictationList): void {
  const store = loadStore();
  store.dictationLists = store.dictationLists.map((d) =>
    d.id === updated.id ? updated : d
  );
  saveStore(store);
}

// ── Session recording ───────────────────────

export function saveSession(session: PracticeSession): void {
  const store = loadStore();
  store.sessions.push(session);
  saveStore(store);
}

// ── Mistake book ────────────────────────────

/** Keep at most this many mistake entries per child (the most recently practiced). */
export const MISTAKE_LIMIT_PER_CHILD = 15;

/**
 * Trim a child's mistakes down to the most-recent MISTAKE_LIMIT_PER_CHILD
 * (by lastPracticed). Returns the kept list plus the entries that were removed
 * (so callers can also delete them from the cloud).
 */
export function pruneChildMistakes(
  mistakes: MistakeEntry[],
  childId: string,
  limit = MISTAKE_LIMIT_PER_CHILD
): { kept: MistakeEntry[]; removed: MistakeEntry[] } {
  const ofChild = mistakes
    .filter((m) => m.childId === childId)
    .sort((a, b) => b.lastPracticed.localeCompare(a.lastPracticed));
  if (ofChild.length <= limit) return { kept: mistakes, removed: [] };
  const removed = ofChild.slice(limit);
  const removedIds = new Set(removed.map((m) => m.wordId));
  const kept = mistakes.filter((m) => !(m.childId === childId && removedIds.has(m.wordId)));
  return { kept, removed };
}

export function addMistake(entry: MistakeEntry): void {
  const store = loadStore();
  const existing = store.mistakes.find(
    (m) => m.wordId === entry.wordId && m.childId === entry.childId
  );
  if (existing) {
    existing.wrongCount += 1;
    existing.lastPracticed = entry.lastPracticed;
  } else {
    store.mistakes.push(entry);
  }
  store.mistakes = pruneChildMistakes(store.mistakes, entry.childId).kept;
  saveStore(store);
}

// ── Coins ────────────────────────────────────

export function getCoins(childId: string): number {
  const store = loadStore();
  return (store as unknown as { coins?: Record<string, number> }).coins?.[childId] ?? 0;
}

export function addCoins(childId: string, amount: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    if (!store.coins) store.coins = {};
    store.coins[childId] = (store.coins[childId] ?? 0) + amount;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* ignore */ }
}

// ── Simple ID generator ─────────────────────
// Replaced by Supabase UUIDs in production.

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
