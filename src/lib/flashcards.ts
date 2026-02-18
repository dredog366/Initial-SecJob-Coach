import { QUESTION_BANK } from "./questionBank";
import type { TrackId } from "./tracks";
import { todayStr } from "./storage";

export type CardGrade = 0 | 1 | 2 | 3 | 4 | 5;

export type Flashcard = {
  id: string;            // use question id as card id
  track: TrackId | "both";
  front: string;
  back: string;

  // SM-2-ish fields
  repetitions: number;   // successful reviews count
  intervalDays: number;  // current interval in days
  ease: number;          // E-Factor
  due: string;           // YYYY-MM-DD
  lastReviewed: string | null;
};

const FC_KEY = "secjobcoach:flashcards:v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function addDays(dayStr: string, days: number): string {
  const d = new Date(dayStr);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function loadFlashcards(): Record<string, Flashcard> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FC_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Flashcard>;
  } catch {
    return {};
  }
}

export function saveFlashcards(map: Record<string, Flashcard>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FC_KEY, JSON.stringify(map));
}

/**
 * Build initial cards from QUESTION_BANK:
 * - use short questions (and optionally quiz) as cards
 * - back is the "answer" if present; for quiz, back shows the correct choice
 */
export function ensureFlashcardsExist() {
  const map = loadFlashcards();
  let changed = false;

  const candidates = QUESTION_BANK.filter(
    (q) => (q.kind === "short" || q.kind === "quiz") && (q.answer || q.choices?.length)
  );

  for (const q of candidates) {
    if (map[q.id]) continue;

    const back =
      q.kind === "quiz"
        ? `Correct: ${q.answer ?? ""}`
        : q.answer ?? "No answer key provided yet.";

    map[q.id] = {
      id: q.id,
      track: q.track,
      front: q.prompt,
      back,
      repetitions: 0,
      intervalDays: 0,
      ease: 2.5,
      due: todayStr(),
      lastReviewed: null,
    };
    changed = true;
  }

  if (changed) saveFlashcards(map);
}

export function getDueCards(track: TrackId, limit = 10): Flashcard[] {
  ensureFlashcardsExist();
  const map = loadFlashcards();
  const t = todayStr();

  const all = Object.values(map).filter(
    (c) => (c.track === track || c.track === "both") && c.due <= t
  );

  // prioritize most overdue first
  all.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  return all.slice(0, limit);
}

export function reviewCard(cardId: string, grade: CardGrade): Flashcard | null {
  ensureFlashcardsExist();
  const map = loadFlashcards();
  const card = map[cardId];
  if (!card) return null;

  // SM-2 formula:
  // If grade < 3 => reset reps to 0 and interval to 1
  // Else increment reps and interval: 1, 6, then *ease
  // Ease update: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q)*0.02))
  const now = todayStr();

  let ease = card.ease;
  const q = grade;
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = clamp(ease, 1.3, 3.0);

  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;

  if (grade < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
    intervalDays = clamp(intervalDays, 1, 365);
  }

  const next: Flashcard = {
    ...card,
    ease,
    repetitions,
    intervalDays,
    due: addDays(now, intervalDays),
    lastReviewed: now,
  };

  map[cardId] = next;
  saveFlashcards(map);
  return next;
}

export function flashcardStats(track: TrackId) {
  ensureFlashcardsExist();
  const map = loadFlashcards();
  const t = todayStr();
  const cards = Object.values(map).filter((c) => c.track === track || c.track === "both");
  const due = cards.filter((c) => c.due <= t).length;
  return { total: cards.length, due };
}
