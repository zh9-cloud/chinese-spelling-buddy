# Chinese Dictation Buddy · 华文听写助手

A mobile-first Progressive Web App for Singapore Primary 3–6 students to practise Chinese spelling and dictation tests independently.

---

## Quick Start

```bash
npm install
npm run dev
# → open http://localhost:3000
```

---

## Folder Structure

```
chinese-dictation-buddy/
│
├── app/                        ← Next.js App Router pages
│   ├── layout.tsx              ← Root HTML shell + PWA metadata
│   ├── page.tsx                ← Landing page
│   ├── loading.tsx             ← Global loading spinner
│   ├── not-found.tsx           ← 404 page
│   │
│   ├── parent/
│   │   ├── dashboard/page.tsx  ← Parent home screen
│   │   └── add-dictation/      ← Create/edit dictation lists
│   │
│   └── student/
│       ├── dashboard/page.tsx  ← Student home screen
│       ├── learn/page.tsx      ← Learn Mode (flashcards)
│       ├── practice/page.tsx   ← Practice Mode (audio → recall)
│       ├── test/page.tsx       ← Test Mode (self-marking)
│       └── mistakes/page.tsx   ← Mistake Book
│
├── components/
│   ├── ui/                     ← Generic reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── layout/
│   │   └── AppShell.tsx        ← Top nav bar + max-width wrapper
│   │
│   ├── parent/                 ← Parent-specific cards
│   │   ├── ChildProfileCard.tsx
│   │   ├── UpcomingDictationCard.tsx
│   │   └── RecentPracticeCard.tsx
│   │
│   └── student/                ← Student-specific widgets
│       ├── ModeButton.tsx
│       ├── WordCard.tsx        ← Flip card (tap to reveal)
│       └── AudioButton.tsx     ← Web Speech API TTS
│
├── lib/
│   ├── types.ts                ← All TypeScript interfaces
│   ├── mockData.ts             ← Sample data + helpers
│   └── storage.ts              ← LocalStorage CRUD layer
│
└── public/
    └── manifest.json           ← PWA install metadata
```

---

## Architectural Decisions (explained for non-engineers)

### Why Next.js 15 with App Router?

Think of Next.js as the framework that turns your React components into a real website. The "App Router" is the newest way to organise pages — each folder under `app/` with a `page.tsx` file automatically becomes a URL. So `app/student/learn/page.tsx` becomes `http://localhost:3000/student/learn`. This makes the codebase easy to navigate: you can find any page by its URL path.

### Why TypeScript?

TypeScript adds a type system on top of JavaScript. It's like having a spell-checker for your code. When you type `child.name`, TypeScript will warn you if `name` doesn't exist. This catches bugs before you even run the app, which is especially valuable when building features over months.

### Why Tailwind CSS?

Tailwind lets you style components using short class names directly in your HTML (`text-red-500`, `rounded-2xl`). There are no separate CSS files to manage. For a product builder who isn't a full-time CSS expert, this is faster than writing custom styles and ensures consistency.

### Why a dedicated `lib/storage.ts`?

All data reads and writes go through this single file. Right now it uses the browser's `localStorage` (a small database built into every web browser). When you're ready to add Supabase (a cloud database), you only need to change this one file — every page and component stays untouched. This is a software principle called "separation of concerns."

### Why `lib/types.ts` as the foundation?

Types are defined once and imported everywhere. If a `DictationList` gains a new field (e.g., `subjectLevel`), you add it in one place and TypeScript will show you every component that needs updating. This prevents the common mistake of adding a field in the data but forgetting to display it.

### Why LocalStorage for MVP?

LocalStorage is already in every browser — no server, no database, no accounts needed. It lets you ship a working app immediately. The data cap (~5MB) is fine for hundreds of word lists. The main limitation is data doesn't sync between devices, which is why Supabase is planned for Phase 2.

### Why the `AppShell` component?

Every page needs a header bar with a back button and a title. Rather than copying that HTML 8 times, `AppShell` is a single wrapper that every page uses. Change it once → it updates everywhere. This is the most important principle in component-based design.

### Why Web Speech API for audio?

The browser's built-in Text-to-Speech works offline, costs nothing, and is available on iOS, Android, and desktop. It's not perfect Mandarin pronunciation, but it's a working foundation for MVP. Phase 2 can upgrade to a professional TTS service (e.g., Google Cloud TTS) by changing only the `AudioButton` component.

### Why mock data in `lib/mockData.ts`?

Real apps need data to look real during development. The mock data includes realistic Singapore primary school vocabulary so you can demo the app to parents or teachers without needing a backend. When Supabase is added, the mock data is simply replaced by database queries in `storage.ts`.

---

## Data Model

```
Child
 └── has many DictationLists
       └── has many Words

PracticeSession
 └── belongs to DictationList + Child
       └── has many WordResults

MistakeEntry
 └── aggregates WordResults where correct = false
```

---

## PWA Installation

On a phone browser (Safari on iOS, Chrome on Android):
1. Visit the app URL
2. Tap the Share button → "Add to Home Screen"
3. The app installs like a native app with no App Store

On desktop Chrome:
- Click the install icon in the address bar

---

## Phase 2 Roadmap

| Feature | What's needed |
|---|---|
| Cloud sync | Add Supabase, swap `storage.ts` |
| Login / accounts | Add Supabase Auth, update `layout.tsx` |
| Push notifications | Service Worker + Supabase Edge Functions |
| AI word extraction | Photo upload → OCR API → pre-fill word list |
| Pinyin + meanings | Integrate a Chinese dictionary API |
| Parent progress report | Add analytics queries in `storage.ts` |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 | Industry standard, great for PWA |
| Language | TypeScript | Catch bugs early, better editor support |
| Styling | Tailwind CSS | Fast, consistent, mobile-first |
| State | React useState | Simple enough for MVP |
| Persistence | LocalStorage | Zero infrastructure for MVP |
| Audio | Web Speech API | Free, offline, built into browsers |
| Future DB | Supabase | Open-source, real-time, easy auth |
