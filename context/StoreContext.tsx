"use client";

// ─────────────────────────────────────────────
//  StoreContext — single source of truth for app data
//
//  Strategy:
//  • localStorage is the immediate, synchronous cache
//  • When the user is logged in, Supabase is the persistent backend
//  • On login → fetch from Supabase → merge into localStorage + state
//  • On every mutation → update state + localStorage + (async) Supabase
// ─────────────────────────────────────────────

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  AppStore,
  Child,
  DictationList,
  PracticeSession,
  MistakeEntry,
} from "@/lib/types";
import {
  loadStore,
  saveStore,
  newId,
  pruneChildMistakes,
} from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { MOCK_CHILDREN, MOCK_DICTATION_LISTS, MOCK_SESSIONS, MOCK_MISTAKES } from "@/lib/mockData";

// ─── Supabase mapping helpers ───────────────────────────────────────────────

async function fetchStoreFromSupabase(userId: string): Promise<AppStore | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const [childrenRes, listsRes, sessionsRes, mistakesRes] = await Promise.all([
    sb.from("children").select("*").eq("parent_id", userId),
    sb.from("dictation_lists").select("*"),
    sb.from("practice_sessions").select("*"),
    sb.from("mistakes").select("*"),
  ]);

  if (childrenRes.error) {
    console.error("[StoreContext] Supabase fetch error:", childrenRes.error.message);
    return null;
  }

  const children: Child[] = (childrenRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    grade: r.grade,
    chineseType: r.chinese_type,
    parentId: r.parent_id,
  }));

  const dictationLists: DictationList[] = (listsRes.data ?? []).map((r) => ({
    id: r.id,
    childId: r.child_id,
    title: r.title,
    dictationDate: r.dictation_date,
    reminderDate: r.reminder_date ?? "",
    words: r.words ?? [],
    createdAt: r.created_at,
  }));

  const sessions: PracticeSession[] = (sessionsRes.data ?? []).map((r) => ({
    id: r.id,
    dictationListId: r.dictation_list_id,
    childId: r.child_id,
    mode: r.mode,
    startedAt: r.started_at,
    completedAt: r.completed_at ?? undefined,
    wordResults: r.word_results ?? [],
  }));

  const mistakes: MistakeEntry[] = (mistakesRes.data ?? []).map((r) => ({
    wordId: r.word_id,
    childId: r.child_id,
    word: r.word,
    pinyin: r.pinyin ?? undefined,
    meaning: r.meaning ?? undefined,
    wrongCount: r.wrong_count,
    lastPracticed: r.last_practiced,
  }));

  return { children, dictationLists, sessions, mistakes };
}

// Supabase write helpers — fire-and-forget from the caller's perspective

async function syncChildrenToSupabase(children: Child[], userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const rows = children.map((c) => ({
    id: c.id, name: c.name, grade: c.grade,
    chinese_type: c.chineseType, parent_id: userId,
  }));

  // 1. Upsert the current children FIRST, so they always persist even if the
  //    cleanup delete below fails for any reason.
  if (rows.length > 0) {
    const { error } = await sb.from("children").upsert(rows, { onConflict: "id" });
    if (error) console.error("[children] upsert error:", error.message);
  }

  // 2. Best-effort cleanup of children removed locally. The PostgREST "not in"
  //    filter needs a (..)-wrapped, quoted value — an array is NOT valid.
  const keepIds = children.map((c) => c.id);
  try {
    if (keepIds.length > 0) {
      const list = `(${keepIds.map((id) => `"${id}"`).join(",")})`;
      await sb.from("children").delete().eq("parent_id", userId).not("id", "in", list);
    } else {
      await sb.from("children").delete().eq("parent_id", userId);
    }
  } catch (e) {
    console.error("[children] cleanup delete failed:", e);
  }
}

async function upsertDictationList(list: DictationList) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("dictation_lists").upsert({
    id: list.id, child_id: list.childId, title: list.title,
    dictation_date: list.dictationDate, reminder_date: list.reminderDate || null,
    words: list.words, created_at: list.createdAt,
  }, { onConflict: "id" });
}

async function deleteDictationListFromSupabase(id: string) {
  const sb = getSupabase();
  if (!sb) return;
  // Cascade (set up in the schema) removes related sessions/mistakes.
  await sb.from("dictation_lists").delete().eq("id", id);
}

async function upsertSession(session: PracticeSession) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("practice_sessions").upsert({
    id: session.id, dictation_list_id: session.dictationListId,
    child_id: session.childId, mode: session.mode,
    started_at: session.startedAt, completed_at: session.completedAt ?? null,
    word_results: session.wordResults,
  }, { onConflict: "id" });
}

async function upsertMistake(entry: MistakeEntry) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("mistakes").upsert({
    word_id: entry.wordId, child_id: entry.childId,
    word: entry.word, pinyin: entry.pinyin ?? null, meaning: entry.meaning ?? null,
    wrong_count: entry.wrongCount, last_practiced: entry.lastPracticed,
  }, { onConflict: "word_id,child_id" });
}

async function deleteMistakeRow(wordId: string, childId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("mistakes").delete().eq("word_id", wordId).eq("child_id", childId);
}

async function upsertCoins(childId: string, amount: number) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("coins").upsert({ child_id: childId, amount }, { onConflict: "child_id" });
}

// Push a whole local store up to Supabase (used to recover data that was added
// while a sync was failing). Children go first — dictation_lists RLS needs the
// child row to already exist.
async function pushStoreToSupabase(store: AppStore, userId: string) {
  await syncChildrenToSupabase(store.children, userId);
  for (const list of store.dictationLists) await upsertDictationList(list);
  for (const s of store.sessions) await upsertSession(s);
  for (const m of store.mistakes) await upsertMistake(m);
}

// ─── Context value type ──────────────────────────────────────────────────────

interface StoreContextValue {
  store: AppStore;
  syncing: boolean;
  // Mutations (update state + localStorage + Supabase)
  saveChildren: (children: Child[]) => void;
  addDictationList: (list: DictationList) => void;
  updateDictationList: (list: DictationList) => void;
  deleteDictationList: (id: string) => void;
  saveSession: (session: PracticeSession) => void;
  addMistake: (entry: MistakeEntry) => void;
  getCoins: (childId: string) => number;
  addCoins: (childId: string, amount: number) => void;
  newId: () => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

function emptyStore(): AppStore {
  return { children: [], dictationLists: [], sessions: [], mistakes: [] };
}

function defaultGuestStore(): AppStore {
  return {
    children: MOCK_CHILDREN,
    dictationLists: MOCK_DICTATION_LISTS,
    sessions: MOCK_SESSIONS,
    mistakes: MOCK_MISTAKES,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, authLoading } = useAuth();
  const [store, setStore] = useState<AppStore>(() => loadStore());
  const [syncing, setSyncing] = useState(false);
  // Track coins separately (same as before, stored alongside main store)
  const [coinsMap, setCoinsMap] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem("cdb_store_v1");
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed as { coins?: Record<string, number> }).coins ?? {};
    } catch { return {}; }
  });
  const userRef = useRef(user);
  userRef.current = user;

  // ── Sync from Supabase when user logs in ─────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not logged in → load from localStorage (may have guest/mock data)
      const ls = loadStore();
      setStore(ls);
      return;
    }

    setSyncing(true);
    fetchStoreFromSupabase(user.id).then((remote) => {
      if (!remote) return; // fetch failed → keep current state, never wipe

      // Read RAW localStorage (not loadStore(), which would inject mock data).
      let local: AppStore | null = null;
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("cdb_store_v1") : null;
        local = raw ? (JSON.parse(raw) as AppStore) : null;
      } catch { local = null; }

      const remoteEmpty = remote.children.length === 0 && remote.dictationLists.length === 0;
      const localHasData =
        !!local && ((local.children?.length ?? 0) > 0 || (local.dictationLists?.length ?? 0) > 0);

      if (remoteEmpty && localHasData && local) {
        // Cloud is empty but we still have local data that never synced.
        // Keep the local data and push it up — do NOT overwrite it with empty.
        setStore(local);
        pushStoreToSupabase(local, user.id).catch((e) =>
          console.error("[StoreContext] recovery push failed:", e));
        return;
      }

      // Otherwise the cloud is the source of truth.
      setStore(remote);
      saveStore(remote);
    }).catch((e) => {
      console.error("[StoreContext] Supabase sync failed:", e);
    }).finally(() => {
      setSyncing(false);
    });
  }, [user, authLoading]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveChildren = useCallback((newChildren: Child[]) => {
    setStore((prev) => {
      const next = { ...prev, children: newChildren };
      saveStore(next);
      if (userRef.current) {
        syncChildrenToSupabase(newChildren, userRef.current.id).catch(console.error);
      }
      return next;
    });
  }, []);

  const addDictationList = useCallback((list: DictationList) => {
    setStore((prev) => {
      const next = { ...prev, dictationLists: [...prev.dictationLists, list] };
      saveStore(next);
      if (userRef.current) upsertDictationList(list).catch(console.error);
      return next;
    });
  }, []);

  const updateDictationList = useCallback((updated: DictationList) => {
    setStore((prev) => {
      const next = {
        ...prev,
        dictationLists: prev.dictationLists.map((d) => d.id === updated.id ? updated : d),
      };
      saveStore(next);
      if (userRef.current) upsertDictationList(updated).catch(console.error);
      return next;
    });
  }, []);

  const deleteDictationList = useCallback((id: string) => {
    setStore((prev) => {
      const next = { ...prev, dictationLists: prev.dictationLists.filter((d) => d.id !== id) };
      saveStore(next);
      if (userRef.current) deleteDictationListFromSupabase(id).catch(console.error);
      return next;
    });
  }, []);

  const saveSession = useCallback((session: PracticeSession) => {
    setStore((prev) => {
      const next = { ...prev, sessions: [...prev.sessions, session] };
      saveStore(next);
      if (userRef.current) upsertSession(session).catch(console.error);
      return next;
    });
  }, []);

  const addMistake = useCallback((entry: MistakeEntry) => {
    setStore((prev) => {
      const mistakes = [...prev.mistakes];
      const idx = mistakes.findIndex(
        (m) => m.wordId === entry.wordId && m.childId === entry.childId
      );
      if (idx >= 0) {
        mistakes[idx] = { ...mistakes[idx], wrongCount: mistakes[idx].wrongCount + 1, lastPracticed: entry.lastPracticed };
      } else {
        mistakes.push(entry);
      }
      const finalEntry = idx >= 0 ? mistakes[idx] : entry;
      // Cap each child's mistakes at the most-recent N; prune the rest.
      const { kept, removed } = pruneChildMistakes(mistakes, entry.childId);
      const next = { ...prev, mistakes: kept };
      saveStore(next);
      if (userRef.current) {
        upsertMistake(finalEntry).catch(console.error);
        for (const r of removed) deleteMistakeRow(r.wordId, r.childId).catch(console.error);
      }
      return next;
    });
  }, []);

  const getCoins = useCallback((childId: string) => coinsMap[childId] ?? 0, [coinsMap]);

  const addCoins = useCallback((childId: string, amount: number) => {
    setCoinsMap((prev) => {
      const next = { ...prev, [childId]: (prev[childId] ?? 0) + amount };
      // Persist coins alongside the store
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("cdb_store_v1");
          const parsed = raw ? JSON.parse(raw) : {};
          parsed.coins = next;
          localStorage.setItem("cdb_store_v1", JSON.stringify(parsed));
        } catch { /* ignore */ }
      }
      if (userRef.current) {
        upsertCoins(childId, next[childId]).catch(console.error);
      }
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{
      store,
      syncing,
      saveChildren,
      addDictationList,
      updateDictationList,
      deleteDictationList,
      saveSession,
      addMistake,
      getCoins,
      addCoins,
      newId,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
