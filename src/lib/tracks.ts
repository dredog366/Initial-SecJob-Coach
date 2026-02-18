export type TrackId = "soc" | "general";

export type Track = {
  id: TrackId;
  name: string;
  description: string;
  modules: string[];
};

export const TRACKS: Track[] = [
  {
    id: "soc",
    name: "SOC Analyst",
    description: "Triage alerts, investigate logs, and respond like a junior analyst.",
    modules: [
      "Alert triage workflow",
      "Windows event log basics",
      "Network fundamentals (DNS/HTTP/TLS)",
      "SIEM searching concepts",
      "Common attacks (phishing/brute force/malware)",
      "IR basics (containment/eradication/evidence)",
      "Writing clear tickets & timelines",
    ],
  },
  {
    id: "general",
    name: "Entry-level Cybersecurity",
    description: "Build strong fundamentals: networking, Linux/Windows, IAM, and security basics.",
    modules: [
      "Networking basics (OSI/TCP/IP/DNS/HTTP)",
      "Linux basics (permissions/processes/logs)",
      "Windows basics (users/services/Event Viewer)",
      "IAM basics (MFA/SSO/least privilege)",
      "Security fundamentals (CIA/risk/threats/vulns)",
      "Web basics (cookies/sessions/OWASP overview)",
      "Tools overview (SIEM vs EDR, scanners)",
    ],
  },
];
