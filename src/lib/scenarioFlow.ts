import type { TrackId } from "./tracks";

export type ArtifactKind = "auth" | "siem" | "edr" | "dns" | "email" | "cloud" | "note";

export type Artifact = {
  id: string;
  kind: ArtifactKind;
  title: string;
  body: string; // plain text block
};

export type ScenarioStep = {
  id: string;
  title: string;
  prompt: string;

  // NEW: artifacts you can reveal during this step
  artifacts?: Artifact[];

  options: {
    id: string;
    label: string;
    score: number; // 0–3
    feedback: string;
  }[];
};

export type ScenarioFlow = {
  id: string;
  track: TrackId;
  title: string;
  severity: "Low" | "Medium" | "High";
  context: string;

  // NEW: artifacts always available for the whole scenario
  globalArtifacts?: Artifact[];

  steps: ScenarioStep[];

  ticketTemplate: {
    fields: { key: string; hint: string }[];
  };
};

export const SCENARIOS: ScenarioFlow[] = [
  {
    id: "soc-impossible-travel",
    track: "soc",
    title: "Impossible Travel Sign-in",
    severity: "High",
    context:
      "SIEM flags a user sign-in from California, then 6 minutes later from Germany. User is a finance employee with access to invoices.",
    globalArtifacts: [
      {
        id: "g1",
        kind: "note",
        title: "Environment notes",
        body: [
          "• IdP: Okta + O365",
          "• Conditional access: MFA required for new device sign-ins (but exceptions exist)",
          "• Finance users are high value targets (invoice fraud, wire requests)",
        ].join("\n"),
      },
    ],
    steps: [
      {
        id: "s1",
        title: "Initial Triage",
        prompt:
          "What do you check first to decide if this is real compromise vs benign?",
        artifacts: [
          {
            id: "a1",
            kind: "siem",
            title: "SIEM alert (summary)",
            body: [
              "Alert: Impossible Travel",
              "User: j.smith@company.com",
              "Events: 2 sign-ins within 6 minutes",
              "Event A: 2026-02-17T09:12:41Z  IP 73.22.18.90  Location: Sacramento, CA  Device: Known (MacBook-Pro)",
              "Event B: 2026-02-17T09:18:03Z  IP 185.199.110.42 Location: Frankfurt, DE Device: New (Windows 11)",
              "Risk: Elevated",
            ].join("\n"),
          },
          {
            id: "a2",
            kind: "auth",
            title: "IdP sign-in details (Event B)",
            body: [
              "Sign-in: SUCCESS",
              "MFA: NOT CHALLENGED",
              "Auth method: Password",
              "Client: 'Chrome/122.0' on Windows 11",
              "Device ID: unknown",
              "Conditional Access: POLICY_NOT_APPLIED (exception: 'Legacy Apps - Finance')",
              "Session: New",
            ].join("\n"),
          },
          {
            id: "a3",
            kind: "cloud",
            title: "O365 audit (post-login, 5 min window)",
            body: [
              "Mailbox: j.smith@company.com",
              "Operations:",
              " - Add-InboxRule (ForwardInvoices) → forward to external: invoices.ap@protonmail.com",
              " - UpdateMailboxSetting (DisableJunkEmail) = true",
              " - MailItemsAccessed: 38",
            ].join("\n"),
          },
        ],
        options: [
          {
            id: "a",
            label:
              "Check MFA/conditional access result + sign-in risk + device/session details",
            score: 3,
            feedback:
              "Strong. This quickly separates benign VPN/SSO behavior from real takeover signals.",
          },
          {
            id: "b",
            label: "Email the user immediately asking if they traveled",
            score: 1,
            feedback:
              "User context helps, but validate telemetry first (MFA/device/session) before tipping off an attacker.",
          },
          {
            id: "c",
            label: "Ignore it — impossible travel is usually false positive",
            score: 0,
            feedback:
              "Risky. It's often benign, but you must validate because impact could be severe.",
          },
        ],
      },
      {
        id: "s2",
        title: "Pivot & Contain",
        prompt:
          "You see the Germany login was NOT MFA challenged, and the device is new. Next best action?",
        artifacts: [
          {
            id: "b1",
            kind: "cloud",
            title: "Conditional access evaluation",
            body: [
              "Policy expected: 'MFA for new device sign-ins'",
              "Reason not applied: User in exception group 'Legacy Apps - Finance'",
              "Last group change: 2026-02-10 by admin: a.nguyen@company.com",
            ].join("\n"),
          },
          {
            id: "b2",
            kind: "auth",
            title: "Additional sign-ins (same IP)",
            body: [
              "185.199.110.42 (Frankfurt) — last 60 minutes:",
              " - j.smith@company.com SUCCESS",
              " - k.lee@company.com FAILED (x12)",
              " - t.patel@company.com FAILED (x9)",
              "Pattern suggests: credential stuffing/spray + one hit",
            ].join("\n"),
          },
        ],
        options: [
          {
            id: "a",
            label:
              "Revoke sessions/tokens, force password reset, and escalate if privileged access is involved",
            score: 3,
            feedback:
              "Correct. No MFA + new device increases confidence. Contain first, then investigate scope.",
          },
          {
            id: "b",
            label: "Wait for more alerts to confirm",
            score: 0,
            feedback:
              "Too slow. You already have strong indicators; delaying increases blast radius.",
          },
          {
            id: "c",
            label: "Block only the Germany IP and close",
            score: 1,
            feedback:
              "Partial. IP blocking helps, but takeover may persist via tokens/sessions and password reuse.",
          },
        ],
      },
      {
        id: "s3",
        title: "Scope Check & Hunt",
        prompt:
          "After containment, what's the most useful scope check?",
        artifacts: [
          {
            id: "c1",
            kind: "email",
            title: "Inbox rule details",
            body: [
              "Rule: ForwardInvoices",
              "Conditions: subject contains 'invoice' OR 'wire'",
              "Actions: forward to invoices.ap@protonmail.com; mark as read",
              "Created: 2026-02-17T09:21:10Z",
            ].join("\n"),
          },
          {
            id: "c2",
            kind: "siem",
            title: "Hunt query idea (pseudo-KQL)",
            body: [
              "Goal: find other mail forwarding rules created recently",
              "",
              "Search: AuditLogs",
              "WHERE Operation == 'Add-InboxRule'",
              "AND TimeGenerated > now()-7d",
              "PROJECT UserId, RuleName, ForwardTo, ClientIP, UserAgent",
              "ORDER BY TimeGenerated desc",
            ].join("\n"),
          },
        ],
        options: [
          {
            id: "a",
            label:
              "Review auth logs for other suspicious sign-ins + mailbox rules/forwarding + recent privileged actions",
            score: 3,
            feedback:
              "Perfect. You're checking persistence (mail rules) and lateral/privileged behavior.",
          },
          {
            id: "b",
            label: "Run a vulnerability scan across the network",
            score: 0,
            feedback:
              "Not relevant to an account takeover triage in the first hour.",
          },
          {
            id: "c",
            label: "Only check the user's laptop antivirus status",
            score: 1,
            feedback:
              "Helpful but too narrow. Auth + mailbox + cloud actions matter more here.",
          },
        ],
      },
    ],
    ticketTemplate: {
      fields: [
        { key: "Summary", hint: "What happened in 1–2 lines?" },
        { key: "Severity", hint: "Low/Med/High + why" },
        { key: "Timeline", hint: "Timestamps + key events" },
        { key: "Indicators", hint: "IPs, device IDs, locations, user agent, mailbox rules" },
        { key: "Actions Taken", hint: "Revoke sessions, reset creds, block IP, remove rule" },
        { key: "Next Steps", hint: "Hunt, monitor, user validation, IR handoff" },
      ],
    },
  },

  {
    id: "soc-bruteforce-success",
    track: "soc",
    title: "Brute Force → Successful Login",
    severity: "Medium",
    context:
      "You see ~200 failed logins over 10 minutes on one user, then a successful login from a new IP.",
    steps: [
      {
        id: "s1",
        title: "Identify Pattern",
        prompt: "What's the best first classification?",
        artifacts: [
          {
            id: "d1",
            kind: "auth",
            title: "Auth failure distribution",
            body: [
              "User: k.lee@company.com",
              "Failures: 203 (10 min)",
              "Source IPs: 1 (45%), 2 (20%), 3 (15%), remaining spread across 14 IPs",
              "User agents: 'python-requests', 'curl', some 'Chrome'",
              "Then SUCCESS from 91.203.18.77 (new IP)",
            ].join("\n"),
          },
        ],
        options: [
          {
            id: "a",
            label:
              "Credential stuffing / brute force attempt (confirm with IP spread and user distribution)",
            score: 3,
            feedback:
              "Good. Next determine spray vs brute force by checking if many users were targeted.",
          },
          {
            id: "b",
            label: "Definitely malware on the user machine",
            score: 0,
            feedback:
              "Could be later, but not the top hypothesis from auth telemetry alone.",
          },
          {
            id: "c",
            label: "Password reset by user caused failures",
            score: 1,
            feedback:
              "Possible, but the volume/pattern usually suggests attack. Validate quickly.",
          },
        ],
      },
      {
        id: "s2",
        title: "Immediate Controls",
        prompt: "What immediate control reduces risk the most right now?",
        artifacts: [
          {
            id: "e1",
            kind: "cloud",
            title: "Post-login activity (first 3 min)",
            body: [
              "Login: SUCCESS 2026-02-17T10:05:09Z",
              "Actions:",
              " - Downloaded 'AllEmployees.xlsx' (SharePoint)",
              " - Accessed 'Payroll-2026' folder",
              " - Attempted to register new MFA device (blocked by policy)",
            ].join("\n"),
          },
        ],
        options: [
          {
            id: "a",
            label: "Force MFA / step-up challenge and revoke active sessions",
            score: 3,
            feedback: "Correct. Stops token/session persistence and reduces takeover likelihood.",
          },
          {
            id: "b",
            label: "Run a full disk encryption check",
            score: 0,
            feedback: "Not an immediate control for account takeover.",
          },
          {
            id: "c",
            label: "Only block the IP",
            score: 1,
            feedback: "Helps, but attackers rotate IPs and sessions may persist.",
          },
        ],
      },
    ],
    ticketTemplate: {
      fields: [
        { key: "Summary", hint: "Failed logins then success from new IP" },
        { key: "Triage", hint: "Spray vs brute force evidence" },
        { key: "User Impact", hint: "Privilege level + systems accessed post-login" },
        { key: "Actions Taken", hint: "MFA, session revoke, reset creds, IP block" },
        { key: "Recommendations", hint: "Conditional access, lockout tuning, alerts" },
      ],
    },
  },
];
