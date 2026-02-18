import type { TrackId } from "./tracks";

export type Mode = "mission" | "scenarios" | "flashcards";

export type Attempt = {
  questionId: string;
  ts: number;
  result: "correct" | "incorrect" | "skipped";
};

export type AppState = {
  selectedTrack: TrackId | null;
  mode: Mode;
  attempts: Attempt[];
  streak: { lastStudyDay: string | null; count: number };
};

const KEY = "secjobcoach:v1";

const defaultState: AppState = {
  selectedTrack: null,
  mode: "mission",
  attempts: [],
  streak: { lastStudyDay: null, count: 0 },
};

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function bumpStreak(prev: AppState["streak"]): AppState["streak"] {
  const t = todayStr();
  if (prev.lastStudyDay === t) return prev;

  const last = prev.lastStudyDay ? new Date(prev.lastStudyDay) : null;
  const now = new Date(t);
  let nextCount = 1;

  if (last) {
    const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    nextCount = diffDays === 1 ? prev.count + 1 : 1;
  }

  return { lastStudyDay: t, count: nextCount };
}
