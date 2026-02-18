import type { TrackId } from "./tracks";
import { QUESTION_BANK, type Question } from "./questionBank";

/**
 * Deterministic daily seed so "Today's Mission" stays the same for the day.
 */
function dailySeed(): number {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  // simple hash-ish number
  return y * 10000 + m * 100 + day;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], n: number, seed: number): T[] {
  const rng = mulberry32(seed);
  const copy = [...arr];
  // Fisher–Yates partial shuffle
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export type Mission = {
  learn: { title: string; bullets: string[] };
  practice: Question[];
  drill: Question[];
};

export function buildMission(track: TrackId): Mission {
  const seed = dailySeed() + (track === "soc" ? 7 : 13);

  const learnBullets =
    track === "soc"
      ? [
          "Triage = scope → confidence → impact → next action.",
          "Always pivot: SIEM alert → endpoint → auth logs → network.",
          "Document a timeline + IOCs + what you checked (even if benign).",
        ]
      : [
          "Auth = proving who you are; Authorization = what you can do.",
          "Risk = likelihood × impact (given threat + vulnerability).",
          "DNS resolves names → then HTTP/TLS does the web request.",
        ];

  const practicePool = QUESTION_BANK.filter(
    (q) => (q.track === track || q.track === "both") && (q.kind === "quiz" || q.kind === "short")
  );
  const drillPool = QUESTION_BANK.filter(
    (q) => (q.track === track || q.track === "both") && q.kind === "interview"
  );

  return {
    learn: {
      title: "Learn (5–7 min)",
      bullets: learnBullets,
    },
    practice: pick(practicePool, 5, seed),
    drill: pick(drillPool, 3, seed + 99),
  };
}
