from flask import Flask, render_template, request, jsonify, session
import random
import json

app = Flask(__name__)
app.secret_key = 'cyber-security-study-app-secret-key-2024'

# SOC Analyst and Cybersecurity Study Content
STUDY_MODULES = {
    'soc_fundamentals': {
        'title': 'SOC Analyst Fundamentals',
        'topics': [
            {
                'name': 'What is a SOC?',
                'content': '''
                <h3>Security Operations Center (SOC)</h3>
                <p>A SOC is a centralized facility that houses a team of security experts who monitor, detect, analyze, and respond to cybersecurity incidents.</p>
                <h4>Key Functions:</h4>
                <ul>
                    <li><strong>Monitoring:</strong> 24/7 surveillance of networks, systems, and applications</li>
                    <li><strong>Detection:</strong> Identifying potential security threats and anomalies</li>
                    <li><strong>Analysis:</strong> Investigating alerts to determine if they are real threats</li>
                    <li><strong>Response:</strong> Taking action to contain and remediate incidents</li>
                    <li><strong>Recovery:</strong> Restoring systems to normal operations</li>
                </ul>
                '''
            },
            {
                'name': 'SOC Analyst Tiers',
                'content': '''
                <h3>SOC Analyst Role Tiers</h3>
                <h4>Tier 1 - Alert Analyst</h4>
                <ul>
                    <li>First line of defense</li>
                    <li>Monitor SIEM alerts and dashboards</li>
                    <li>Perform initial triage of security events</li>
                    <li>Escalate incidents to Tier 2</li>
                </ul>
                <h4>Tier 2 - Incident Responder</h4>
                <ul>
                    <li>Deep-dive investigation of escalated incidents</li>
                    <li>Perform detailed analysis and forensics</li>
                    <li>Contain and remediate threats</li>
                    <li>Create incident reports</li>
                </ul>
                <h4>Tier 3 - Threat Hunter</h4>
                <ul>
                    <li>Proactive threat hunting</li>
                    <li>Advanced threat analysis</li>
                    <li>Develop detection rules and signatures</li>
                    <li>Provide mentorship to junior analysts</li>
                </ul>
                '''
            },
            {
                'name': 'SIEM Overview',
                'content': '''
                <h3>Security Information and Event Management (SIEM)</h3>
                <p>SIEM is a critical tool that aggregates and analyzes security data from across your environment.</p>
                <h4>Key Capabilities:</h4>
                <ul>
                    <li><strong>Log Collection:</strong> Gather logs from multiple sources (firewalls, IDS/IPS, endpoints)</li>
                    <li><strong>Correlation:</strong> Link related events to identify patterns</li>
                    <li><strong>Alerting:</strong> Generate alerts based on predefined rules</li>
                    <li><strong>Dashboards:</strong> Visual representation of security posture</li>
                    <li><strong>Reporting:</strong> Compliance and security reports</li>
                </ul>
                <h4>Popular SIEM Platforms:</h4>
                <ul>
                    <li>Splunk</li>
                    <li>IBM QRadar</li>
                    <li>Microsoft Sentinel</li>
                    <li>Elastic Stack (ELK)</li>
                    <li>ArcSight</li>
                </ul>
                '''
            }
        ]
    },
    'incident_response': {
        'title': 'Incident Response',
        'topics': [
            {
                'name': 'Incident Response Lifecycle',
                'content': '''
                <h3>NIST Incident Response Lifecycle</h3>
                <ol>
                    <li><strong>Preparation:</strong>
                        <ul>
                            <li>Develop IR policies and procedures</li>
                            <li>Train security team</li>
                            <li>Deploy monitoring tools</li>
                            <li>Establish communication channels</li>
                        </ul>
                    </li>
                    <li><strong>Detection and Analysis:</strong>
                        <ul>
                            <li>Monitor for security events</li>
                            <li>Analyze alerts and anomalies</li>
                            <li>Validate incidents</li>
                            <li>Categorize and prioritize</li>
                        </ul>
                    </li>
                    <li><strong>Containment, Eradication, and Recovery:</strong>
                        <ul>
                            <li>Isolate affected systems</li>
                            <li>Remove threat from environment</li>
                            <li>Restore systems to normal operations</li>
                            <li>Verify all threats are eliminated</li>
                        </ul>
                    </li>
                    <li><strong>Post-Incident Activity:</strong>
                        <ul>
                            <li>Document lessons learned</li>
                            <li>Update security controls</li>
                            <li>Improve detection capabilities</li>
                            <li>Share threat intelligence</li>
                        </ul>
                    </li>
                </ol>
                '''
            },
            {
                'name': 'Common Security Incidents',
                'content': '''
                <h3>Types of Security Incidents</h3>
                <h4>Malware Infections:</h4>
                <ul>
                    <li>Ransomware attacks</li>
                    <li>Trojans and backdoors</li>
                    <li>Worms and viruses</li>
                    <li>Spyware and keyloggers</li>
                </ul>
                <h4>Phishing and Social Engineering:</h4>
                <ul>
                    <li>Email phishing campaigns</li>
                    <li>Spear phishing (targeted attacks)</li>
                    <li>Business Email Compromise (BEC)</li>
                    <li>Pretexting and baiting</li>
                </ul>
                <h4>Unauthorized Access:</h4>
                <ul>
                    <li>Credential theft and abuse</li>
                    <li>Privilege escalation</li>
                    <li>Lateral movement</li>
                    <li>Insider threats</li>
                </ul>
                <h4>Denial of Service (DoS/DDoS):</h4>
                <ul>
                    <li>Network flooding attacks</li>
                    <li>Application layer attacks</li>
                    <li>Distributed attacks from botnets</li>
                </ul>
                '''
            }
        ]
    },
    'threat_intelligence': {
        'title': 'Threat Intelligence',
        'topics': [
            {
                'name': 'Threat Intelligence Basics',
                'content': '''
                <h3>Understanding Threat Intelligence</h3>
                <p>Threat intelligence is evidence-based knowledge about existing or emerging threats that can help organizations make informed security decisions.</p>
                <h4>Types of Threat Intelligence:</h4>
                <ul>
                    <li><strong>Strategic:</strong> High-level information for executive decision-making</li>
                    <li><strong>Tactical:</strong> Information about attacker TTPs (Tactics, Techniques, and Procedures)</li>
                    <li><strong>Operational:</strong> Specific details about attacks (who, what, when, where, why)</li>
                    <li><strong>Technical:</strong> Indicators of Compromise (IOCs) - IPs, domains, file hashes</li>
                </ul>
                <h4>Threat Intelligence Sources:</h4>
                <ul>
                    <li>Open Source Intelligence (OSINT)</li>
                    <li>Commercial threat feeds</li>
                    <li>Information Sharing and Analysis Centers (ISACs)</li>
                    <li>Government agencies (CISA, FBI)</li>
                    <li>Security vendor reports</li>
                </ul>
                '''
            },
            {
                'name': 'MITRE ATT&CK Framework',
                'content': '''
                <h3>MITRE ATT&CK Framework</h3>
                <p>A globally accessible knowledge base of adversary tactics and techniques based on real-world observations.</p>
                <h4>Key Tactics (Attack Lifecycle):</h4>
                <ol>
                    <li><strong>Initial Access:</strong> How attackers get into your network</li>
                    <li><strong>Execution:</strong> Running malicious code</li>
                    <li><strong>Persistence:</strong> Maintaining access</li>
                    <li><strong>Privilege Escalation:</strong> Gaining higher-level permissions</li>
                    <li><strong>Defense Evasion:</strong> Avoiding detection</li>
                    <li><strong>Credential Access:</strong> Stealing account credentials</li>
                    <li><strong>Discovery:</strong> Exploring the environment</li>
                    <li><strong>Lateral Movement:</strong> Moving through the network</li>
                    <li><strong>Collection:</strong> Gathering target data</li>
                    <li><strong>Exfiltration:</strong> Stealing data</li>
                    <li><strong>Impact:</strong> Disrupting operations or destroying data</li>
                </ol>
                '''
            }
        ]
    },
    'network_security': {
        'title': 'Network Security',
        'topics': [
            {
                'name': 'Network Security Fundamentals',
                'content': '''
                <h3>Network Security Basics</h3>
                <h4>Defense in Depth:</h4>
                <ul>
                    <li>Firewalls (perimeter defense)</li>
                    <li>Intrusion Detection/Prevention Systems (IDS/IPS)</li>
                    <li>Network segmentation</li>
                    <li>VPNs for secure remote access</li>
                    <li>Network Access Control (NAC)</li>
                </ul>
                <h4>Network Protocols to Monitor:</h4>
                <ul>
                    <li><strong>HTTP/HTTPS:</strong> Web traffic</li>
                    <li><strong>DNS:</strong> Domain name resolution (watch for DNS tunneling)</li>
                    <li><strong>SMTP/POP3/IMAP:</strong> Email protocols</li>
                    <li><strong>SMB:</strong> File sharing (common lateral movement vector)</li>
                    <li><strong>RDP:</strong> Remote desktop (frequently targeted)</li>
                    <li><strong>SSH:</strong> Secure shell access</li>
                </ul>
                '''
            },
            {
                'name': 'Log Analysis',
                'content': '''
                <h3>Security Log Analysis</h3>
                <h4>Critical Logs to Monitor:</h4>
                <ul>
                    <li><strong>Firewall Logs:</strong> Blocked/allowed connections</li>
                    <li><strong>IDS/IPS Logs:</strong> Detected attacks and anomalies</li>
                    <li><strong>Proxy Logs:</strong> Web traffic and downloads</li>
                    <li><strong>Authentication Logs:</strong> Login attempts (successful/failed)</li>
                    <li><strong>DNS Logs:</strong> Domain queries</li>
                    <li><strong>Endpoint Logs:</strong> Process execution, file changes</li>
                </ul>
                <h4>Suspicious Indicators:</h4>
                <ul>
                    <li>Multiple failed login attempts (brute force)</li>
                    <li>Logins from unusual locations/times</li>
                    <li>Large data transfers to external IPs</li>
                    <li>Connections to known malicious IPs</li>
                    <li>Unusual DNS queries (DGA domains)</li>
                    <li>Privilege escalation events</li>
                </ul>
                '''
            }
        ]
    }
}

# Quiz Questions
QUIZ_QUESTIONS = [
    {
        'question': 'What does SOC stand for?',
        'options': [
            'Security Operations Center',
            'System Operations Control',
            'Security Oversight Committee',
            'Software Operations Center'
        ],
        'correct': 0,
        'explanation': 'SOC stands for Security Operations Center, which is a centralized facility that monitors, detects, analyzes, and responds to cybersecurity incidents.'
    },
    {
        'question': 'What is the primary purpose of a SIEM?',
        'options': [
            'To replace antivirus software',
            'To aggregate and analyze security data from multiple sources',
            'To scan for vulnerabilities',
            'To encrypt network traffic'
        ],
        'correct': 1,
        'explanation': 'A SIEM (Security Information and Event Management) system aggregates and analyzes security data from various sources to identify threats and security incidents.'
    },
    {
        'question': 'Which tier of SOC analyst typically performs initial triage of alerts?',
        'options': [
            'Tier 1 - Alert Analyst',
            'Tier 2 - Incident Responder',
            'Tier 3 - Threat Hunter',
            'Tier 4 - Security Architect'
        ],
        'correct': 0,
        'explanation': 'Tier 1 analysts are the first line of defense who monitor alerts and perform initial triage before escalating to higher tiers.'
    },
    {
        'question': 'What is the first phase of the NIST Incident Response Lifecycle?',
        'options': [
            'Detection and Analysis',
            'Containment',
            'Preparation',
            'Recovery'
        ],
        'correct': 2,
        'explanation': 'Preparation is the first phase, involving developing policies, training teams, and deploying monitoring tools.'
    },
    {
        'question': 'What does IOC stand for in cybersecurity?',
        'options': [
            'Internal Operations Center',
            'Indicator of Compromise',
            'Internet Operations Command',
            'Incident Observation Criteria'
        ],
        'correct': 1,
        'explanation': 'IOC stands for Indicator of Compromise - technical artifacts that suggest a security breach, such as malicious IP addresses, file hashes, or domain names.'
    },
    {
        'question': 'Which MITRE ATT&CK tactic involves attackers maintaining access to a system?',
        'options': [
            'Initial Access',
            'Persistence',
            'Discovery',
            'Exfiltration'
        ],
        'correct': 1,
        'explanation': 'Persistence tactics involve techniques that adversaries use to maintain their foothold in a system across reboots and credential changes.'
    },
    {
        'question': 'What type of attack floods a network with traffic to make services unavailable?',
        'options': [
            'Phishing',
            'Man-in-the-Middle',
            'DDoS (Distributed Denial of Service)',
            'SQL Injection'
        ],
        'correct': 2,
        'explanation': 'DDoS attacks overwhelm systems with massive amounts of traffic from multiple sources, making services unavailable to legitimate users.'
    },
    {
        'question': 'Which protocol is commonly used for lateral movement in Windows networks?',
        'options': [
            'HTTP',
            'FTP',
            'SMB',
            'SNMP'
        ],
        'correct': 2,
        'explanation': 'SMB (Server Message Block) is frequently used by attackers for lateral movement in Windows environments, often with tools like PsExec.'
    },
    {
        'question': 'What is a typical indicator of a brute force attack?',
        'options': [
            'A single successful login',
            'Multiple failed login attempts in a short time',
            'Regular system updates',
            'Normal file downloads'
        ],
        'correct': 1,
        'explanation': 'Multiple failed login attempts in a short period typically indicate a brute force attack where an attacker is trying many password combinations.'
    },
    {
        'question': 'What does TTP stand for in threat intelligence?',
        'options': [
            'Technical Testing Procedures',
            'Tactics, Techniques, and Procedures',
            'Threat Testing Protocol',
            'Total Threat Protection'
        ],
        'correct': 1,
        'explanation': 'TTP stands for Tactics, Techniques, and Procedures - the patterns of activities or methods associated with a specific threat actor.'
    }
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/modules')
def modules():
    return render_template('modules.html', modules=STUDY_MODULES)

@app.route('/module/<module_id>')
def module_detail(module_id):
    if module_id in STUDY_MODULES:
        module = STUDY_MODULES[module_id]
        return render_template('module_detail.html', module=module, module_id=module_id)
    return "Module not found", 404

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/api/quiz/start', methods=['POST'])
def start_quiz():
    # Shuffle questions for each quiz session
    shuffled_questions = random.sample(QUIZ_QUESTIONS, len(QUIZ_QUESTIONS))
    session['quiz_questions'] = shuffled_questions
    session['current_question'] = 0
    session['score'] = 0
    session['answers'] = []
    return jsonify({'success': True, 'total_questions': len(shuffled_questions)})

@app.route('/api/quiz/question', methods=['GET'])
def get_question():
    if 'quiz_questions' not in session:
        return jsonify({'error': 'Quiz not started'}), 400
    
    current = session['current_question']
    questions = session['quiz_questions']
    
    if current >= len(questions):
        return jsonify({'completed': True})
    
    question = questions[current].copy()
    # Don't send the correct answer to the client
    question_data = {
        'question': question['question'],
        'options': question['options'],
        'number': current + 1,
        'total': len(questions)
    }
    return jsonify(question_data)

@app.route('/api/quiz/answer', methods=['POST'])
def submit_answer():
    if 'quiz_questions' not in session:
        return jsonify({'error': 'Quiz not started'}), 400
    
    data = request.get_json()
    selected = data.get('answer')
    
    current = session['current_question']
    questions = session['quiz_questions']
    question = questions[current]
    
    is_correct = selected == question['correct']
    if is_correct:
        session['score'] = session.get('score', 0) + 1
    
    session['answers'].append({
        'question': question['question'],
        'selected': selected,
        'correct': question['correct'],
        'is_correct': is_correct
    })
    
    session['current_question'] = current + 1
    session.modified = True
    
    return jsonify({
        'correct': is_correct,
        'correct_answer': question['correct'],
        'explanation': question['explanation']
    })

@app.route('/api/quiz/results', methods=['GET'])
def get_results():
    if 'quiz_questions' not in session:
        return jsonify({'error': 'Quiz not started'}), 400
    
    score = session.get('score', 0)
    total = len(session['quiz_questions'])
    percentage = (score / total * 100) if total > 0 else 0
    
    return jsonify({
        'score': score,
        'total': total,
        'percentage': round(percentage, 1),
        'answers': session.get('answers', [])
    })

@app.route('/flashcards')
def flashcards():
    return render_template('flashcards.html')

@app.route('/api/flashcards', methods=['GET'])
def get_flashcards():
    flashcards = [
        {'term': 'SOC', 'definition': 'Security Operations Center - A centralized facility for monitoring, detecting, analyzing, and responding to cybersecurity incidents.'},
        {'term': 'SIEM', 'definition': 'Security Information and Event Management - A solution that aggregates and analyzes security data from multiple sources.'},
        {'term': 'IDS', 'definition': 'Intrusion Detection System - A device or software that monitors network traffic for suspicious activity and alerts administrators.'},
        {'term': 'IPS', 'definition': 'Intrusion Prevention System - Similar to IDS but can actively block detected threats.'},
        {'term': 'IOC', 'definition': 'Indicator of Compromise - Technical artifacts that suggest a security breach (e.g., malicious IP addresses, file hashes).'},
        {'term': 'TTP', 'definition': 'Tactics, Techniques, and Procedures - Patterns of activities associated with specific threat actors.'},
        {'term': 'MITRE ATT&CK', 'definition': 'A knowledge base of adversary tactics and techniques based on real-world observations.'},
        {'term': 'Phishing', 'definition': 'A social engineering attack where attackers impersonate legitimate entities to steal credentials or information.'},
        {'term': 'Ransomware', 'definition': 'Malware that encrypts victim data and demands payment for decryption.'},
        {'term': 'DDoS', 'definition': 'Distributed Denial of Service - An attack that floods systems with traffic to make them unavailable.'},
        {'term': 'Lateral Movement', 'definition': 'Techniques attackers use to move through a network after initial compromise.'},
        {'term': 'Privilege Escalation', 'definition': 'Exploiting vulnerabilities to gain higher-level permissions on a system.'},
        {'term': 'Zero Day', 'definition': 'A vulnerability that is unknown to the software vendor and has no available patch.'},
        {'term': 'APT', 'definition': 'Advanced Persistent Threat - Sophisticated, prolonged cyberattacks by well-resourced adversaries.'},
        {'term': 'Firewall', 'definition': 'A network security device that monitors and controls incoming and outgoing traffic based on security rules.'},
        {'term': 'EDR', 'definition': 'Endpoint Detection and Response - A security solution that monitors endpoints for suspicious activity.'},
        {'term': 'Threat Hunting', 'definition': 'Proactively searching for threats that have evaded existing security controls.'},
        {'term': 'Blue Team', 'definition': 'Defensive security team responsible for protecting systems and detecting attacks.'},
        {'term': 'Red Team', 'definition': 'Offensive security team that simulates attacks to test defenses.'},
        {'term': 'OSINT', 'definition': 'Open Source Intelligence - Information collected from publicly available sources.'}
    ]
    return jsonify(flashcards)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
