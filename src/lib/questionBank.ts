import type { TrackId } from "./tracks";

export type QuestionKind = "quiz" | "short" | "scenario" | "interview";

export type Question = {
  id: string;
  track: TrackId | "both";
  kind: QuestionKind;
  prompt: string;
  choices?: string[];          // for quiz
  answer?: string;             // short expected answer / key points
  rubric?: string[];           // interview/scenario evaluation bullets
};

export const QUESTION_BANK: Question[] = [
  // ===== SOC: Scenarios (later used heavily by mode B) =====
  {
    id: "soc-s1",
    track: "soc",
    kind: "scenario",
    prompt:
      "Impossible travel: user signs in from California, then 6 minutes later from Germany. What do you check first and what actions might you take?",
    rubric: [
      "Confirm MFA status and conditional access",
      "Check device/session details and sign-in risk",
      "Review IP reputation / ASN / geo details",
      "Validate with user context (travel, VPN, known devices)",
      "Revoke sessions / reset creds if suspicious",
    ],
  },
  {
    id: "soc-s2",
    track: "soc",
    kind: "scenario",
    prompt:
      "200 failed logins on one account over 10 minutes, then a success. Walk through your triage steps.",
    rubric: [
      "Identify source IP(s) and pattern (spray vs brute force)",
      "Check MFA and lockout controls",
      "Assess account privilege and recent changes",
      "Review post-auth activity (new rules, token creation, access to sensitive apps)",
      "Decide containment (block IP, reset creds, force MFA, revoke tokens)",
    ],
  },
  {
    id: "soc-s3",
    track: "soc",
    kind: "scenario",
    prompt:
      "Endpoint alert: PowerShell encoded command executed. What are your next 3 steps?",
    rubric: [
      "Isolate host (if policy allows)",
      "Gather command line + parent process details",
      "Check network connections from the host",
      "Collect file hash and search for IOCs across fleet",
      "Document findings and escalate if needed",
    ],
  },
  {
    id: "soc-s4",
    track: "soc",
    kind: "scenario",
    prompt:
      "Alert says 'new local admin added' on a workstation. What do you validate?",
    rubric: [
      "Check for change ticket / authorized request",
      "Identify who made the change and when",
      "Review endpoint owner and their role",
      "Look for prior alerts on this host",
      "Check for lateral movement indicators",
    ],
  },
  {
    id: "soc-s5",
    track: "soc",
    kind: "scenario",
    prompt:
      "EDR flags periodic DNS queries to random subdomains. What does that suggest and what do you do?",
    rubric: [
      "Potential C2 via DNS beaconing",
      "Identify the process making the queries",
      "Block the domain at DNS/firewall",
      "Hunt across other hosts for similar behavior",
      "Collect artifacts for further analysis",
    ],
  },

  // ===== General fundamentals (quiz/short) =====
  {
    id: "gen-q1",
    track: "general",
    kind: "short",
    prompt: "Explain the difference between a threat, a vulnerability, and risk.",
    answer:
      "Threat = potential cause of harm; Vulnerability = weakness; Risk = likelihood × impact given a threat exploiting a vulnerability.",
  },
  {
    id: "gen-q2",
    track: "both",
    kind: "short",
    prompt: "What is least privilege? Give a simple example.",
    answer:
      "Give users/systems only the minimum permissions needed. Example: analyst can read logs but cannot change IAM roles.",
  },
  {
    id: "gen-q3",
    track: "general",
    kind: "short",
    prompt: "High-level: what happens when you type a URL and press Enter?",
    answer:
      "DNS resolves name → TCP/TLS connection → HTTP request/response → browser renders HTML/CSS/JS and fetches assets.",
  },
  {
    id: "gen-q4",
    track: "general",
    kind: "short",
    prompt: "What's the difference between hashing and encryption?",
    answer:
      "Hashing is one-way (cannot reverse); Encryption is two-way (can decrypt with key). Hashing verifies integrity; Encryption protects confidentiality.",
  },
  {
    id: "gen-q5",
    track: "general",
    kind: "short",
    prompt: "What is MFA and why does it help?",
    answer:
      "Multi-Factor Authentication requires 2+ factors (something you know, have, or are). It prevents account takeover even if password is compromised.",
  },
  {
    id: "gen-q6",
    track: "both",
    kind: "short",
    prompt: "What's a SIEM vs EDR?",
    answer:
      "SIEM = central log collection/correlation for visibility. EDR = endpoint behavior monitoring/response on individual devices. They complement each other.",
  },
  {
    id: "gen-q7",
    track: "general",
    kind: "short",
    prompt: "Explain DNS like you're talking to a non-technical person.",
    answer:
      "DNS is like a phone book for the internet. You type a name (like google.com) and DNS looks up the address (IP) so your browser knows where to go.",
  },

  // ===== Interview drills (used in Mission 'Drill') =====
  {
    id: "int-1",
    track: "soc",
    kind: "interview",
    prompt:
      "You get a high-severity SIEM alert at 2am. How do you decide whether to escalate immediately?",
    rubric: [
      "Clarify scope (affected host/account), confidence, and business impact",
      "Check if it matches known benign patterns",
      "Pivot to corroborating signals (EDR, auth logs, network)",
      "Containment criteria and escalation thresholds",
      "Communicate clearly with timeline and next steps",
    ],
  },
  {
    id: "int-2",
    track: "both",
    kind: "interview",
    prompt: "Explain SIEM vs EDR to a non-technical manager in 30 seconds.",
    rubric: [
      "SIEM = central log collection/correlation",
      "EDR = endpoint behavior monitoring/response on devices",
      "Mention how they complement each other",
    ],
  },
  {
    id: "int-3",
    track: "soc",
    kind: "interview",
    prompt: "Walk me through how you would triage a phishing report from an employee.",
    rubric: [
      "Thank the reporter and gather details (email headers, links, attachments)",
      "Check if others received the same email",
      "Analyze URLs/attachments in sandbox",
      "Block malicious indicators",
      "Communicate findings and remediation",
    ],
  },
  {
    id: "int-4",
    track: "both",
    kind: "interview",
    prompt: "What's the CIA triad and give an example of each?",
    rubric: [
      "Confidentiality = only authorized access (encryption)",
      "Integrity = data is accurate and unaltered (hashing)",
      "Availability = systems are accessible when needed (backups, redundancy)",
    ],
  },
  {
    id: "int-5",
    track: "general",
    kind: "interview",
    prompt: "How would you explain a firewall to a non-technical person?",
    rubric: [
      "It's like a security guard for your network",
      "Checks traffic coming in and going out",
      "Blocks suspicious or unauthorized traffic",
      "Uses rules to decide what's allowed",
    ],
  },

  // ===== Quiz examples (used in Practice block) =====
  {
    id: "quiz-1",
    track: "both",
    kind: "quiz",
    prompt: "Which control most directly reduces account takeover from password reuse?",
    choices: ["Antivirus", "MFA", "Disk encryption", "Backups"],
    answer: "MFA",
  },
  {
    id: "quiz-2",
    track: "general",
    kind: "quiz",
    prompt: "DNS primarily maps:",
    choices: ["IP to MAC", "Domain names to IPs", "Ports to processes", "Users to roles"],
    answer: "Domain names to IPs",
  },
  {
    id: "quiz-3",
    track: "general",
    kind: "quiz",
    prompt: "Which OSI layer does a firewall typically operate at?",
    choices: ["Layer 1 - Physical", "Layer 2 - Data Link", "Layer 3/4 - Network/Transport", "Layer 7 - Application"],
    answer: "Layer 3/4 - Network/Transport",
  },
  {
    id: "quiz-4",
    track: "soc",
    kind: "quiz",
    prompt: "Event ID 4625 in Windows typically indicates:",
    choices: ["Successful login", "Failed login", "Account lockout", "Password change"],
    answer: "Failed login",
  },
  {
    id: "quiz-5",
    track: "soc",
    kind: "quiz",
    prompt: "What does IOC stand for?",
    choices: ["Internet of Clouds", "Indicator of Compromise", "Input/Output Controller", "Incident Operations Center"],
    answer: "Indicator of Compromise",
  },
  {
    id: "quiz-6",
    track: "general",
    kind: "quiz",
    prompt: "Which protocol uses port 443 by default?",
    choices: ["HTTP", "HTTPS", "SSH", "FTP"],
    answer: "HTTPS",
  },
];
