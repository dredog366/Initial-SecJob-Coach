"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadState, saveState, bumpStreak, type AppState } from "@/lib/storage";
import { SCENARIOS, type ScenarioFlow, type Artifact } from "@/lib/scenarioFlow";

type StepAnswer = { stepId: string; optionId: string; score: number };

function ArtifactViewer({
  artifacts,
  title = "Artifacts",
}: {
  artifacts: Artifact[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(artifacts[0]?.id ?? "");

  const active = artifacts.find((a) => a.id === activeId) ?? artifacts[0];

  if (!artifacts.length) return null;

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="font-semibold">{title}</div>
        <button onClick={() => setOpen((v) => !v)} className="underline text-slate-700">
          {open ? "Hide" : "Reveal"}
        </button>
      </div>

      {open ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {artifacts.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveId(a.id)}
                className={`rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 ${
                  a.id === activeId ? "border-slate-900" : "border-slate-200"
                }`}
              >
                {a.kind.toUpperCase()}: {a.title}
              </button>
            ))}
          </div>

          <pre className="whitespace-pre-wrap rounded-2xl border p-4 text-sm overflow-auto">
            {active?.body ?? ""}
          </pre>
        </>
      ) : (
        <p className="text-sm text-slate-600">
          Reveal artifacts when you need more evidence to decide the next action.
        </p>
      )}
    </div>
  );
}

export default function Practice() {
  const [state, setState] = useState<AppState | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<StepAnswer[]>([]);
  const [ticket, setTicket] = useState<Record<string, string>>({});

  useEffect(() => setState(loadState()), []);

  const track = state?.selectedTrack ?? null;

  const scenarioList = useMemo(() => {
    if (!track) return [];
    return SCENARIOS.filter((s) => s.track === track);
  }, [track]);

  const scenario: ScenarioFlow | null = useMemo(() => {
    if (!scenarioId) return scenarioList[0] ?? null;
    return scenarioList.find((s) => s.id === scenarioId) ?? (scenarioList[0] ?? null);
  }, [scenarioId, scenarioList]);

  useEffect(() => {
    if (!scenarioId && scenarioList.length) setScenarioId(scenarioList[0].id);
  }, [scenarioId, scenarioList]);

  function bumpStudy() {
    if (!state) return;
    const next = { ...state, streak: bumpStreak(state.streak) };
    saveState(next);
    setState(next);
  }

  function resetRun() {
    setStepIndex(0);
    setAnswers([]);
    setTicket({});
  }

  function chooseScenario(id: string) {
    setScenarioId(id);
    resetRun();
  }

  function selectOption(stepId: string, optionId: string, score: number) {
    if (answers.some((a) => a.stepId === stepId)) return;
    setAnswers((prev) => [...prev, { stepId, optionId, score }]);
    bumpStudy();
  }

  function nextStep() {
    if (!scenario) return;
    setStepIndex((i) => Math.min(i + 1, scenario.steps.length));
  }

  function prevStep() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const maxScore = scenario ? scenario.steps.length * 3 : 0;
  const finished = scenario ? answers.length >= scenario.steps.length : false;

  // ticket quality check (simple keyword presence)
  const ticketChecks = useMemo(() => {
    if (!scenario) return [];
    const combined = Object.values(ticket).join("\n").toLowerCase();

    const checks = [
      { label: "Has timeline timestamps", pass: /\d{4}-\d{2}-\d{2}t\d{2}:\d{2}/.test(combined) },
      { label: "Mentions IP / location", pass: combined.includes("ip") || combined.includes("frankfurt") || combined.includes("sacramento") },
      { label: "Mentions actions taken", pass: combined.includes("revoke") || combined.includes("reset") || combined.includes("block") || combined.includes("remove rule") },
      { label: "Mentions indicators (IOC)", pass: combined.includes("device") || combined.includes("user agent") || combined.includes("forward") || combined.includes("rule") },
    ];

    return checks;
  }, [ticket, scenario]);

  if (!state) return <main className="p-6">Loading…</main>;

  if (!track) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-3xl font-semibold">Scenario Room</h1>
        <p className="text-slate-600">Pick a track first.</p>
        <Link className="underline" href="/">Go select a track</Link>
      </main>
    );
  }

  if (!scenario) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-3xl font-semibold">Scenario Room</h1>
        <p className="text-slate-600">No scenarios yet for this track.</p>
        <Link className="underline" href="/dashboard">← Dashboard</Link>
      </main>
    );
  }

  const step = scenario.steps[stepIndex] ?? null;
  const answeredThisStep = step ? answers.find((a) => a.stepId === step.id) : null;
  const chosenOption =
    step && answeredThisStep
      ? step.options.find((o) => o.id === answeredThisStep.optionId) ?? null
      : null;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">Scenario Room</h1>
            <p className="text-slate-600">Use artifacts to justify decisions like a real SOC analyst.</p>
          </div>
          <Link className="underline" href="/dashboard">← Dashboard</Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          {scenarioList.map((s) => (
            <button
              key={s.id}
              onClick={() => chooseScenario(s.id)}
              className={`rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 ${
                s.id === scenario.id ? "border-slate-900" : "border-slate-200"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-2xl border p-5 space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">{scenario.title}</h2>
            <p className="text-slate-600">Severity: {scenario.severity}</p>
          </div>
          <div className="rounded-2xl border px-4 py-2">
            <div className="text-sm text-slate-600">Score</div>
            <div className="text-xl font-semibold">
              {totalScore} / {maxScore}
            </div>
          </div>
        </div>
        <p className="text-slate-700">{scenario.context}</p>
      </section>

      {scenario.globalArtifacts?.length ? (
        <ArtifactViewer artifacts={scenario.globalArtifacts} title="Scenario Artifacts (always available)" />
      ) : null}

      {!finished && step ? (
        <section className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-slate-500">
                Step {stepIndex + 1} / {scenario.steps.length}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={prevStep}
                className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                disabled={stepIndex === 0}
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="rounded-xl bg-slate-900 px-3 py-2 text-white hover:opacity-90"
                disabled={!answeredThisStep}
              >
                Next
              </button>
            </div>
          </div>

          <p className="text-slate-800">{step.prompt}</p>

          {step.artifacts?.length ? (
            <ArtifactViewer artifacts={step.artifacts} title="Step Artifacts" />
          ) : null}

          <div className="grid gap-2">
            {step.options.map((o) => {
              const isChosen = answeredThisStep?.optionId === o.id;
              const isLocked = !!answeredThisStep && !isChosen;

              return (
                <button
                  key={o.id}
                  onClick={() => selectOption(step.id, o.id, o.score)}
                  disabled={!!answeredThisStep}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    isChosen
                      ? "border-slate-900"
                      : isLocked
                      ? "opacity-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium">{o.label}</div>
                </button>
              );
            })}
          </div>

          {chosenOption ? (
            <div className="rounded-2xl border p-4 space-y-1">
              <div className="text-sm text-slate-500">Feedback</div>
              <div className="text-slate-800">{chosenOption.feedback}</div>
              <div className="text-sm text-slate-500">Points: {chosenOption.score} / 3</div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xl font-semibold">Ticket Notes (write-up)</h3>
            <button onClick={resetRun} className="underline text-slate-700">
              Restart scenario
            </button>
          </div>

          <p className="text-slate-600">
            Fill concise, high-signal notes. Include timeline, IOCs, and actions.
          </p>

          <div className="space-y-3">
            {scenario.ticketTemplate.fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <div className="text-sm text-slate-600">{f.key}</div>
                <textarea
                  value={ticket[f.key] ?? ""}
                  onChange={(e) => setTicket((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border p-3 min-h-[70px]"
                  placeholder={f.hint}
                />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-4 space-y-2">
            <div className="text-sm text-slate-500">Ticket quality checks</div>
            <ul className="space-y-1">
              {ticketChecks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${c.pass ? "bg-green-600" : "bg-slate-300"}`} />
                  <span className="text-slate-700">{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border p-4 space-y-2">
            <div className="text-sm text-slate-500">Your run summary</div>
            <div className="text-slate-800">
              Score: <span className="font-semibold">{totalScore}</span> / {maxScore}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link href="/dashboard" className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:opacity-90">
              Back to Mission
            </Link>
            <Link href="/flashcards" className="rounded-xl border px-4 py-2 hover:bg-slate-50">
              Do Flashcards
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
