"use client";

import type { Mode } from "@/lib/storage";

export default function ModeSwitch({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const items: { id: Mode; label: string }[] = [
    { id: "mission", label: "Mission" },
    { id: "scenarios", label: "Scenarios" },
    { id: "flashcards", label: "Flashcards" },
  ];

  return (
    <div className="inline-flex rounded-2xl border p-1 gap-1">
      {items.map((it) => {
        const active = it.id === mode;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`rounded-xl px-3 py-2 text-sm transition ${
              active ? "bg-slate-900 text-white" : "hover:bg-slate-50"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
