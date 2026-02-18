"use client";

import { useEffect, useState } from "react";
import { TRACKS, type TrackId } from "@/lib/tracks";
import { loadState, saveState, type AppState } from "@/lib/storage";
import Link from "next/link";

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  function chooseTrack(id: TrackId) {
    if (!state) return;
    const next = { ...state, selectedTrack: id, mode: "mission" as const };
    saveState(next);
    setState(next);
  }

  const selected = state?.selectedTrack ?? null;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">SecJob Coach</h1>
        <p className="text-slate-600">
          Daily missions to prep for entry-level cybersecurity jobs.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            onClick={() => chooseTrack(t.id)}
            className={`rounded-2xl border p-5 text-left hover:shadow-sm transition ${
              selected === t.id ? "border-slate-900" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              {selected === t.id ? (
                <span className="text-sm px-2 py-1 rounded-full border">Selected</span>
              ) : null}
            </div>
            <p className="mt-2 text-slate-600">{t.description}</p>
            <p className="mt-3 text-sm text-slate-500">
              Modules: {t.modules.slice(0, 3).join(" • ")} • …
            </p>
          </button>
        ))}
      </section>

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-white hover:opacity-90"
        >
          Go to Dashboard
        </Link>

        <Link
          href="/practice"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2 hover:bg-slate-50"
        >
          Practice
        </Link>

        <Link
          href="/flashcards"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2 hover:bg-slate-50"
        >
          Flashcards
        </Link>
      </div>
    </main>
  );
}
