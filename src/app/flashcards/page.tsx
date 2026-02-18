"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadState, saveState, bumpStreak, type AppState } from "@/lib/storage";
import { getDueCards, reviewCard, type Flashcard, type CardGrade, flashcardStats } from "@/lib/flashcards";

function GradeButton({
  label,
  grade,
  onGrade,
}: {
  label: string;
  grade: CardGrade;
  onGrade: (g: CardGrade) => void;
}) {
  return (
    <button
      onClick={() => onGrade(grade)}
      className="rounded-xl border px-3 py-2 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}

export default function Flashcards() {
  const [state, setState] = useState<AppState | null>(null);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const s = loadState();
    setState(s);
  }, []);

  const track = state?.selectedTrack ?? null;

  const stats = useMemo(() => {
    if (!track) return { total: 0, due: 0 };
    return flashcardStats(track);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, queue.length]);

  useEffect(() => {
    if (!track) return;
    const due = getDueCards(track, 12);
    setQueue(due);
    setShowBack(false);
  }, [track]);

  function refreshQueue() {
    if (!track) return;
    setQueue(getDueCards(track, 12));
    setShowBack(false);
  }

  function bumpStudy() {
    if (!state) return;
    const next = { ...state, streak: bumpStreak(state.streak) };
    saveState(next);
    setState(next);
  }

  function gradeCurrent(g: CardGrade) {
    const current = queue[0];
    if (!current) return;

    reviewCard(current.id, g);
    bumpStudy();

    // pop current card and refresh if queue runs low
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setShowBack(false);

    if (nextQueue.length < 3) {
      // small delay so UI feels snappy
      setTimeout(refreshQueue, 100);
    }
  }

  if (!state) return <main className="p-6">Loading…</main>;

  if (!track) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-3xl font-semibold">Flashcards</h1>
        <p className="text-slate-600">Pick a track first.</p>
        <Link className="underline" href="/">
          Go select a track
        </Link>
      </main>
    );
  }

  const current = queue[0] ?? null;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Flashcards</h1>
          <p className="text-slate-600">
            Due today: <span className="font-medium">{stats.due}</span> / Total:{" "}
            <span className="font-medium">{stats.total}</span>
          </p>
          <div className="flex gap-3 pt-1">
            <Link className="underline" href="/dashboard">
              ← Dashboard
            </Link>
            <button onClick={refreshQueue} className="underline">
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-3">
          <div className="text-sm text-slate-600">Streak</div>
          <div className="text-2xl font-semibold">{state.streak.count}🔥</div>
        </div>
      </header>

      {!current ? (
        <section className="rounded-2xl border p-6 space-y-2">
          <h2 className="text-xl font-semibold">You&apos;re done for now 🎉</h2>
          <p className="text-slate-600">
            No due cards. Come back tomorrow (or add more cards to the bank).
          </p>
          <Link href="/practice" className="underline">
            Do a scenario instead →
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border p-6 space-y-4">
          <div className="text-sm text-slate-500">
            Card {1} of {queue.length} in queue
          </div>

          <div className="space-y-2">
            <div className="text-lg font-semibold">Front</div>
            <div className="text-slate-800">{current.front}</div>
          </div>

          {showBack ? (
            <div className="space-y-2">
              <div className="text-lg font-semibold">Back</div>
              <div className="text-slate-800 whitespace-pre-wrap">{current.back}</div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {!showBack ? (
              <button
                onClick={() => setShowBack(true)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:opacity-90"
              >
                Reveal answer
              </button>
            ) : (
              <>
                <GradeButton label="Again" grade={1} onGrade={gradeCurrent} />
                <GradeButton label="Hard" grade={3} onGrade={gradeCurrent} />
                <GradeButton label="Good" grade={4} onGrade={gradeCurrent} />
                <GradeButton label="Easy" grade={5} onGrade={gradeCurrent} />
              </>
            )}
          </div>

          <div className="text-sm text-slate-500">
            Grading uses a simple SM-2 style schedule (ease + intervals).
          </div>
        </section>
      )}
    </main>
  );
}
