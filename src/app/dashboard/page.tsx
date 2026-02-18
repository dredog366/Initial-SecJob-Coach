"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildMission } from "@/lib/mission";
import { loadState, saveState, bumpStreak, type AppState, type Attempt } from "@/lib/storage";
import { QUESTION_BANK, type Question } from "@/lib/questionBank";
import ModeSwitch from "@/components/ModeSwitch";
import { flashcardStats } from "@/lib/flashcards";

function QuestionCard({
  q,
  onAnswer,
}: {
  q: Question;
  onAnswer: (result: Attempt["result"], isCorrect?: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");

  if (q.kind === "quiz" && q.choices) {
    const correct = q.answer ?? "";
    return (
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="font-medium">{q.prompt}</div>
        <div className="grid gap-2">
          {q.choices.map((c) => {
            const selected = picked === c;
            return (
              <button
                key={c}
                onClick={() => setPicked(c)}
                className={`rounded-xl border px-3 py-2 text-left hover:bg-slate-50 ${
                  selected ? "border-slate-900" : "border-slate-200"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!picked) return;
              const isCorrect = picked === correct;
              onAnswer(isCorrect ? "correct" : "incorrect", isCorrect);
            }}
            className="rounded-xl bg-slate-900 px-3 py-2 text-white hover:opacity-90"
          >
            Submit
          </button>
          <button
            onClick={() => onAnswer("skipped")}
            className="rounded-xl border px-3 py-2 hover:bg-slate-50"
          >
            Skip
          </button>
        </div>
        {q.answer ? <div className="text-sm text-slate-600">Answer: {q.answer}</div> : null}
      </div>
    );
  }

  // short / interview shown as short answer (for MVP)
  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="font-medium">{q.prompt}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your answer…"
        className="w-full rounded-xl border p-3 min-h-[90px]"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onAnswer("correct")}
          className="rounded-xl bg-slate-900 px-3 py-2 text-white hover:opacity-90"
          title="Self-grade for now (we'll add rubric scoring later)"
        >
          Mark correct
        </button>
        <button
          onClick={() => onAnswer("incorrect")}
          className="rounded-xl border px-3 py-2 hover:bg-slate-50"
        >
          Mark incorrect
        </button>
        <button
          onClick={() => onAnswer("skipped")}
          className="rounded-xl border px-3 py-2 hover:bg-slate-50"
        >
          Skip
        </button>
      </div>

      {q.answer ? <div className="text-sm text-slate-600">Key: {q.answer}</div> : null}
      {q.rubric?.length ? (
        <ul className="text-sm text-slate-600 list-disc pl-5">
          {q.rubric.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const track = state?.selectedTrack ?? null;

  const mission = useMemo(() => {
    if (!track) return null;
    return buildMission(track);
  }, [track]);

  const fcStats = useMemo(() => {
    if (!track) return { total: 0, due: 0 };
    return flashcardStats(track);
  }, [track]);

  const attemptsById = useMemo(() => {
    const map = new Map<string, Attempt[]>();
    (state?.attempts ?? []).forEach((a) => {
      const arr = map.get(a.questionId) ?? [];
      arr.push(a);
      map.set(a.questionId, arr);
    });
    return map;
  }, [state]);

  const weakTopics = useMemo(() => {
    // simple heuristic: questions with >=2 incorrect in history
    const weak: { id: string; prompt: string; incorrect: number }[] = [];
    for (const q of QUESTION_BANK) {
      const atts = attemptsById.get(q.id) ?? [];
      const incorrect = atts.filter((a) => a.result === "incorrect").length;
      if (incorrect >= 2) weak.push({ id: q.id, prompt: q.prompt, incorrect });
    }
    return weak.slice(0, 5);
  }, [attemptsById]);

  function setMode(mode: AppState["mode"]) {
    if (!state) return;
    const next = { ...state, mode };
    saveState(next);
    setState(next);
  }

  function recordAttempt(questionId: string, result: Attempt["result"]) {
    if (!state) return;
    const nextAttempts = [...state.attempts, { questionId, result, ts: Date.now() }];
    const nextStreak = bumpStreak(state.streak);
    const next = { ...state, attempts: nextAttempts, streak: nextStreak };
    saveState(next);
    setState(next);
  }

  if (!state) {
    return <main className="p-6">Loading…</main>;
  }

  if (!track || !mission) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">Pick a track first.</p>
        <Link className="underline" href="/">
          Go select a track
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Today&apos;s Mission</h1>
          <p className="text-slate-600">
            Track: <span className="font-medium">{track}</span>
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <ModeSwitch mode={state.mode} onChange={setMode} />

            {state.mode === "scenarios" ? (
              <Link href="/practice" className="underline">
                Open Scenario Room →
              </Link>
            ) : null}

            {state.mode === "flashcards" ? (
              <Link href="/flashcards" className="underline">
                Open Flashcards → (due: {fcStats.due}/{fcStats.total})
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-3">
          <div className="text-sm text-slate-600">Streak</div>
          <div className="text-2xl font-semibold">{state.streak.count}🔥</div>
        </div>
      </header>

      {state.mode === "mission" ? (
        <>
          {/* Learn */}
          <section className="rounded-2xl border p-5 space-y-3">
            <h2 className="text-xl font-semibold">{mission.learn.title}</h2>
            <ul className="list-disc pl-5 text-slate-700">
              {mission.learn.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="text-sm text-slate-500">
              (Next: we&apos;ll add &quot;Read more&quot; links + mini diagrams)
            </div>
          </section>

          {/* Practice */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Practice (10–12 min)</h2>
            <div className="space-y-3">
              {mission.practice.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  onAnswer={(result) => recordAttempt(q.id, result)}
                />
              ))}
            </div>
          </section>

          {/* Drill */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Drill (5–8 min)</h2>
            <div className="space-y-3">
              {mission.drill.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  onAnswer={(result) => recordAttempt(q.id, result)}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border p-5">
          {state.mode === "scenarios" ? (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Scenarios Mode</h2>
              <p className="text-slate-600">
                Go to the Scenario Room for investigations and triage practice.
              </p>
              <Link href="/practice" className="underline">
                Open Scenario Room →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Flashcards Mode</h2>
              <p className="text-slate-600">
                Review due cards with spaced repetition.
              </p>
              <Link href="/flashcards" className="underline">
                Open Flashcards → (due: {fcStats.due}/{fcStats.total})
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Weak areas */}
      <section className="rounded-2xl border p-5 space-y-2">
        <h2 className="text-xl font-semibold">Weak Areas</h2>
        {weakTopics.length ? (
          <ul className="list-disc pl-5 text-slate-700">
            {weakTopics.map((w) => (
              <li key={w.id}>
                {w.prompt} <span className="text-slate-500">(incorrect: {w.incorrect})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">Nothing flagged yet — keep going.</p>
        )}
        <div className="flex gap-3 pt-2">
          <Link href="/" className="underline">
            Switch track
          </Link>
          <Link href="/practice" className="underline">
            Scenario Room
          </Link>
          <Link href="/flashcards" className="underline">
            Flashcards
          </Link>
        </div>
      </section>
    </main>
  );
}
