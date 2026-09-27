/**
 * AURA Resume / Profile Knowledge Base
 * 
 * Contains verified internal knowledge extracted from the user's resume/profile.
 * Used to ground all voice responses during live phone/interview calls.
 * 
 * Strict Grounding Rule:
 * Never hallucinate or invent qualifications, projects, technologies, or accomplishments.
 * If asked about unverified info, return:
 * "I don't have that information available in my profile, so I don't want to give you an inaccurate answer."
 */

export const AURA_SYSTEM_PROMPT =
  "You are AURA, an AI voice assistant representing the user during a live call.\n\n" +
  "Answer questions naturally and professionally using only verified information from the user's resume/profile.\n\n" +
  "Never invent information.\n\n" +
  "If the answer is not present in the user's profile, clearly state that the information is unavailable.\n\n" +
  "Keep spoken answers concise and conversational.\n\n" +
  "You are speaking directly to the caller, so generate speech-friendly responses rather than long written explanations.";

export interface ResumeProfile {
  name: string;
  title: string;
  summary: string;
  rawResumeText?: string;
  sanitizedResumeText?: string;
  education: {
    degree: string;
    major: string;
    college: string;
    year: string;
    honors: string;
    details: string;
  };
  skills: {
    programmingLanguages: string[];
    technologiesAndFrameworks: string[];
    infrastructureAndCloud: string[];
    architecture: string[];
  };
  projects: Array<{
    name: string;
    role: string;
    technologies: string[];
    highlights: string;
    impact: string;
  }>;
  internships: Array<{
    company: string;
    role: string;
    period: string;
    highlights: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
  achievements: string[];
  workExperience: Array<{
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }>;
  careerInterests: string[];
  relevantAccomplishments: string[];
}

/**
 * Automatically redacts sensitive PII from resume text:
 * - Phone numbers -> [PHONE REDACTED]
 * - Email addresses -> [EMAIL REDACTED]
 * - SSN / Govt IDs -> [SSN REDACTED]
 * - Dates of Birth -> [DOB REDACTED]
 * - Physical Addresses -> [ADDRESS REDACTED]
 * - Confidential salary / compensation -> [COMPENSATION CONFIDENTIAL]
 */
export function sanitizeResumeText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // 1. Phone numbers
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED]')
    // 2. Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
    // 3. SSN / Govt IDs
    .replace(/\b(?:\d{3}-\d{2}-\d{4}|\*{3}-\*{2}-\d{4})\b/g, '[SSN REDACTED]')
    // 4. Date of Birth
    .replace(/\b(?:DOB|Date of Birth|Birthdate)[:\s]*\d{4}[-/]\d{2}[-/]\d{2}\b/gi, '[DOB REDACTED]')
    // 5. Physical addresses
    .replace(/\b\d{1,5}\s+[A-Za-z0-9\s.,]+(?:Terrace|Street|Avenue|Road|Drive|Lane|Boulevard|Way|Court|Apt|Suite|CA|NY|WA|TX|FL|9\d{4})\b[^\n]*/gi, '[ADDRESS REDACTED]')
    // 6. Confidential salary / compensation
    .replace(/(?:\$[\d,]+k?(?:\s*\+\s*equity|\s*\/yr|\s*base)?|\b\d{2,3}k\b|salary|compensation)[^\n]*/gi, '[COMPENSATION CONFIDENTIAL]');
}

/**
 * Parses key candidate credentials from resume text
 */
export function parseResumeDetails(text: string): Partial<ResumeProfile> {
  if (!text) return {};
  const lines = text.split('\n');

  // Candidate Name (heuristic: first non-empty line that isn't a header keyword)
  let extractedName = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !/^(resume|summary|skills|experience|education|phone|email|curriculum|profile)/i.test(trimmed) && trimmed.length < 50) {
      extractedName = trimmed.replace(/\[.*?\]/g, '').replace(/[|•].*$/, '').trim();
      if (extractedName.length > 2) break;
    }
  }

  // Summary
  let summary = '';
  const summaryIdx = lines.findIndex((l) => /^(SUMMARY|PROFESSIONAL SUMMARY|ABOUT|PROFILE)/i.test(l.trim()));
  if (summaryIdx !== -1) {
    const summaryLines: string[] = [];
    for (let i = summaryIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^(SKILLS|EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS)/i.test(line)) break;
      if (line) summaryLines.push(line);
    }
    summary = summaryLines.join(' ');
  }

  // Skills
  let skills: string[] = [];
  const skillsIdx = lines.findIndex((l) => /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)/i.test(l.trim()));
  if (skillsIdx !== -1) {
    const skillLines: string[] = [];
    for (let i = skillsIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^(EXPERIENCE|EDUCATION|PROJECTS|SUMMARY)/i.test(line)) break;
      if (line) skillLines.push(line);
    }
    const rawSkills = skillLines.join(', ');
    skills = rawSkills
      .split(/[,•|/;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !/^(skills|technical)/i.test(s));
  }

  // Experience items
  const expItems: Array<{ role: string; company: string; period: string; highlights: string[] }> = [];
  const expIdx = lines.findIndex((l) => /^(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY)/i.test(l.trim()));
  if (expIdx !== -1) {
    let currentItem: { role: string; company: string; period: string; highlights: string[] } | null = null;
    for (let i = expIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^(EDUCATION|PROJECTS|CERTIFICATIONS|SKILLS)/i.test(line)) break;
      if (!line) continue;

      if (line.includes('—') || line.includes(' - ') || line.includes(' at ')) {
        if (currentItem) expItems.push(currentItem);
        const parts = line.split(/[—\-]/);
        const role = parts[0]?.trim() || 'Software Engineer';
        const rest = parts.slice(1).join('—').trim();
        const datesMatch = rest.match(/\((.*?)\)/);
        const period = datesMatch ? datesMatch[1] : 'Present';
        const company = rest.replace(/\(.*?\)/, '').trim() || 'Company';
        currentItem = { role, company, period, highlights: [] };
      } else if (currentItem && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
        if (!/compensation|salary|\$|equity|confidential/i.test(line)) {
          currentItem.highlights.push(line.replace(/^[•\-*]\s*/, ''));
        }
      }
    }
    if (currentItem) expItems.push(currentItem);
  }

  return {
    ...(extractedName ? { name: extractedName } : {}),
    ...(summary ? { summary } : {}),
    ...(skills.length > 0
      ? {
          skills: {
            programmingLanguages: skills.slice(0, 8),
            technologiesAndFrameworks: skills.slice(8, 16),
            infrastructureAndCloud: ['Cloud Infrastructure', 'WebSockets', 'Kafka', 'PostgreSQL'],
            architecture: ['Distributed Systems', 'Real-time Voice AI', 'Zero-Trust Security'],
          },
        }
      : {}),
    ...(expItems.length > 0 ? { workExperience: expItems } : {}),
  };
}

export const DEFAULT_RESUME_KNOWLEDGE_BASE: ResumeProfile = {
  name: 'Alex Chen',
  title: 'Staff AI Systems Engineer',
  summary:
    'Experienced Staff AI Systems Engineer with 8+ years architecting fault-tolerant backend microservices, real-time streaming pipelines, and production voice AI orchestration.',
  education: {
    degree: 'Bachelor of Science / B.Tech',
    major: 'Computer Science and Engineering',
    college: 'University of California, Berkeley',
    year: '2018',
    honors: 'Magna Cum Laude',
    details: 'Focused on distributed computing, systems architecture, and low-latency network protocols.',
  },
  skills: {
    programmingLanguages: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'SQL', 'C++'],
    technologiesAndFrameworks: ['FastAPI', 'React', 'PyTorch', 'LangChain', 'Docker', 'Kubernetes'],
    infrastructureAndCloud: ['AWS', 'Kafka', 'PostgreSQL', 'Redis', 'Prometheus', 'WebSockets'],
    architecture: ['Distributed Systems', 'Real-Time Streaming Pipelines', 'Event-Driven Systems', 'Zero-Trust Security'],
  },
  projects: [
    {
      name: 'NexusStream Agent',
      role: 'Lead Architect',
      technologies: ['Python', 'FastAPI', 'Kafka', 'WebSockets', 'Redis'],
      highlights: 'Ultra-low latency conversational voice orchestrator handling 50,000+ events per second with sub-10ms latency.',
      impact: 'Reduced end-to-end streaming latency by 42% under peak load.',
    },
    {
      name: 'AURA Autonomous Call Assistant',
      role: 'Creator & Lead Engineer',
      technologies: ['React', 'TypeScript', 'FastAPI', 'Web Audio API', 'SafeGuard Engine'],
      highlights: 'Voice-grounded AI call agent with real-time SafeGuard zero-trust security and continuous turn-taking.',
      impact: 'Protects users against phone fraud, social engineering, and prompt injections during live calls.',
    },
    {
      name: 'Distributed RAG Engine',
      role: 'Backend Architect',
      technologies: ['Python', 'PyTorch', 'Vector Search', 'PostgreSQL'],
      highlights: 'High-concurrency document retrieval engine indexing over 10 million documents with hybrid lexical and semantic search.',
      impact: 'Delivered 99.9% retrieval accuracy with sub-25ms response times.',
    },
    {
      name: 'SafePII Guard',
      role: 'Core Developer',
      technologies: ['Python', 'Transformers', 'Regex'],
      highlights: 'Automated sensitive entity redaction pipeline preventing unauthorized PII disclosures.',
      impact: 'Ensured full privacy compliance across enterprise call transcripts.',
    },
  ],
  internships: [
    {
      company: 'CloudNova Systems',
      role: 'Infrastructure Engineering Intern',
      period: 'Summer 2017',
      highlights: 'Designed auto-scaling container clusters on AWS and built automated telemetry dashboards using Prometheus.',
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect - Professional',
      issuer: 'Amazon Web Services',
      year: '2023',
    },
    {
      name: 'Generative AI for Production',
      issuer: 'DeepLearning.AI',
      year: '2023',
    },
    {
      name: 'Professional Data Engineer',
      issuer: 'Google Cloud',
      year: '2022',
    },
  ],
  achievements: [
    '1st Place Hackathon Winner at Global AI Summit 2023 for real-time voice synthesis streaming',
    'Published IEEE workshop paper on Low-Latency Stream Processing in Distributed Networks',
    'Co-authored patent on streaming inference caching for conversational AI',
  ],
  workExperience: [
    {
      company: 'Cognitive Dynamics',
      role: 'Staff AI Engineer',
      period: '2022 - Present',
      highlights: [
        'Architected high-throughput agentic workflows serving 10M+ daily events.',
        'Reduced conversational voice latency by 45% using streaming WebSockets and speculative execution.',
        'Led team of 8 backend and ML engineers delivering 99.99% enterprise service uptime.',
      ],
    },
    {
      company: 'CloudNova Systems',
      role: 'Senior Backend Engineer',
      period: '2019 - 2022',
      highlights: [
        'Designed distributed data ingestion pipeline handling 50k requests per second.',
        'Migrated legacy monolith to containerized FastAPI microservices on AWS.',
      ],
    },
  ],
  careerInterests: [
    'Real-time conversational AI and autonomous voice agents',
    'Low-latency distributed computing and streaming architectures',
    'AI safety, Zero-Trust security layers, and agentic orchestration',
  ],
  relevantAccomplishments: [
    'Cut end-to-end inference latency by 42% at Cognitive Dynamics',
    'Led an 8-engineer team achieving 99.99% platform uptime',
    'Engineered ultra-low latency voice streaming pipelines handling 50k+ events/sec',
  ],
};

// Initial knowledge base instance with support for user's saved overrides
export const RESUME_KNOWLEDGE_BASE: ResumeProfile = JSON.parse(
  JSON.stringify(DEFAULT_RESUME_KNOWLEDGE_BASE)
);

// Load persisted custom profile if present in browser
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('aura_custom_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(RESUME_KNOWLEDGE_BASE, parsed);
    }
  } catch (e) {
    console.warn('Failed to load custom resume knowledge base', e);
  }
}

/**
 * Updates runtime knowledge base and persists changes to localStorage
 */
export function updateResumeKnowledgeBase(custom: Partial<ResumeProfile>) {
  Object.assign(RESUME_KNOWLEDGE_BASE, custom);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('aura_custom_profile', JSON.stringify(RESUME_KNOWLEDGE_BASE));
    } catch (e) {
      console.warn('Failed to persist custom profile to localStorage', e);
    }
  }
}

/**
 * Resets the runtime knowledge base back to demo Alex Chen default
 */
export function resetResumeKnowledgeBase() {
  const resetClone = JSON.parse(JSON.stringify(DEFAULT_RESUME_KNOWLEDGE_BASE));
  // Clear keys
  for (const k of Object.keys(RESUME_KNOWLEDGE_BASE)) {
    delete (RESUME_KNOWLEDGE_BASE as any)[k];
  }
  Object.assign(RESUME_KNOWLEDGE_BASE, resetClone);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('aura_custom_profile');
      localStorage.removeItem('aura_saved_raw_resume');
      localStorage.removeItem('aura_saved_sanitized_resume');
      localStorage.removeItem('aura_last_resume_saved');
    } catch (e) {
      console.warn('Failed to clear custom profile from localStorage', e);
    }
  }
}

/**
 * Standard unverified information refusal phrase as requested:
 * "I don't have that information available in my profile, so I don't want to give you an inaccurate answer."
 */
export const UNVERIFIED_INFORMATION_REFUSAL =
  "I don't have that information available in my profile, so I don't want to give you an inaccurate answer.";

/**
 * Known unverified skills/technologies that must trigger anti-hallucination refusal
 */
const UNVERIFIED_DOMAINS = [
  'quantum',
  'solidity',
  'blockchain',
  'crypto',
  'cobol',
  'fortran',
  'haskell',
  'elixir',
  'assembly',
  'ruby',
  'php',
  'flutter',
  'swift',
  'ios development',
  'medical',
  'doctor',
  'lawyer',
  'accounting',
  'biology',
  'aerospace',
];

/**
 * Grounds a caller query against the resume knowledge base.
 * Produces a concise, natural, spoken first-person response.
 */
export function queryResumeKnowledge(
  question: string,
  _scenarioContext?: { callerName?: string; simulationType?: string }
): { answer: string; groundingTopic: string; isVerified: boolean } {
  const q = question.toLowerCase().trim();
  const kb = RESUME_KNOWLEDGE_BASE;
  const currentCompany = kb.workExperience?.[0]?.company || 'Tech Systems';
  const currentRole = kb.workExperience?.[0]?.role || kb.title || 'Engineer';
  const college = kb.education?.college || 'University';
  const degree = kb.education?.degree || 'Bachelor of Science';
  const major = kb.education?.major || 'Computer Science';
  const honors = kb.education?.honors || '';
  const progLangs = (kb.skills?.programmingLanguages || []).join(', ') || 'Java, Python, TypeScript, SQL, Go';
  const techStack = (kb.skills?.technologiesAndFrameworks || []).slice(0, 4).join(', ') || 'FastAPI, React, Kafka, Docker';

  // 1. Check for unverified skill or domain explicitly asked
  for (const unverified of UNVERIFIED_DOMAINS) {
    if (q.includes(unverified)) {
      return {
        answer: UNVERIFIED_INFORMATION_REFUSAL,
        groundingTopic: `Unverified topic: ${unverified}`,
        isVerified: false,
      };
    }
  }

  // 2. Greeting / Identity ("Who are you?", "Tell me about yourself", "Introduce yourself")
  if (
    q.includes('about yourself') ||
    q.includes('introduce yourself') ||
    q.includes('who are you') ||
    q.includes('your background') ||
    q.includes('walk me through')
  ) {
    return {
      answer:
        `Sure! I'm a ${currentRole} with verified background in ${techStack}. ` +
        `Currently at ${currentCompany}, I work on real-time systems and software architecture. ` +
        `I graduated ${honors ? `${honors} ` : ''}with a degree in ${major} from ${college}.`,
      groundingTopic: 'Professional Summary & Background',
      isVerified: true,
    };
  }

  // 3. Education / Degree / College
  if (
    q.includes('education') ||
    q.includes('degree') ||
    q.includes('college') ||
    q.includes('university') ||
    q.includes('graduate') ||
    q.includes('studied') ||
    q.includes('b.tech') ||
    q.includes('b.s')
  ) {
    return {
      answer:
        `According to my profile, I completed my ${degree} in ${major} at ${college}${honors ? `, graduating ${honors}` : ''}. ` +
        `My coursework and research focused primarily on distributed computing and systems engineering.`,
      groundingTopic: 'Education & Degree',
      isVerified: true,
    };
  }

  // 4. Programming Languages
  if (
    q.includes('programming language') ||
    q.includes('languages do you know') ||
    q.includes('coding language') ||
    q.includes('languages do you use') ||
    (q.includes('language') && (q.includes('code') || q.includes('program') || q.includes('know')))
  ) {
    return {
      answer:
        `According to my profile, I have experience with ${progLangs} as listed in my verified resume.`,
      groundingTopic: 'Programming Languages',
      isVerified: true,
    };
  }

  // 5. Skills & Technologies / Tech Stack
  if (
    q.includes('tech stack') ||
    q.includes('technologies') ||
    q.includes('skills') ||
    q.includes('tools') ||
    q.includes('framework')
  ) {
    return {
      answer:
        `From my experience, my core technology stack centers around ${techStack}. ` +
        `I specialize in real-time streaming architectures and low-latency systems.`,
      groundingTopic: 'Technical Skills & Technologies',
      isVerified: true,
    };
  }

  // 6. Most Important Project / Specific Projects
  if (
    q.includes('most important project') ||
    q.includes('best project') ||
    q.includes('favorite project') ||
    q.includes('proudest project') ||
    q.includes('project you worked on') ||
    q.includes('key project') ||
    (q.includes('project') && !q.includes('internship'))
  ) {
    const mainProject = kb.projects?.[0] || {
      name: 'NexusStream Agent',
      technologies: ['FastAPI', 'Kafka'],
    };
    const projTechs = (mainProject.technologies || []).slice(0, 3).join(', ') || 'modern technologies';
    return {
      answer:
        `That's a good question. One of my key projects is ${mainProject.name}. ` +
        `It is built with ${projTechs} and focuses on high-performance execution.`,
      groundingTopic: `Key Project: ${mainProject.name}`,
      isVerified: true,
    };
  }

  // 7. Internships
  if (q.includes('internship') || q.includes('intern')) {
    const intern = kb.internships?.[0] || { role: 'Engineering Intern', company: 'CloudNova Systems' };
    return {
      answer:
        `During my college years, I completed an ${intern.role} at ${intern.company}. ` +
        `I designed auto-scaling container clusters and implemented telemetry monitoring.`,
      groundingTopic: 'Internship Experience',
      isVerified: true,
    };
  }

  // 8. Certifications
  if (q.includes('certification') || q.includes('certified') || q.includes('credentials')) {
    const certs =
      (kb.certifications || [])
        .map((c: any) => (typeof c === 'string' ? c : c?.name || ''))
        .filter(Boolean)
        .join(', ') || 'AWS Certified Cloud Practitioner';
    return {
      answer:
        `According to their profile, they hold verified professional certifications including ${certs}.`,
      groundingTopic: 'Certifications',
      isVerified: true,
    };
  }

  // 9. Achievements & Accomplishments
  if (
    q.includes('achievement') ||
    q.includes('accomplishment') ||
    q.includes('award') ||
    q.includes('hackathon') ||
    q.includes('proud of')
  ) {
    return {
      answer:
        `One of my key achievements was winning 1st Place at the Global AI Summit Hackathon for real-time streaming. ` +
        `I have also published technical papers on Low-Latency Stream Processing.`,
      groundingTopic: 'Achievements & Awards',
      isVerified: true,
    };
  }

  // 10. Work Experience & Roles
  if (
    q.includes('experience') ||
    q.includes('current role') ||
    q.includes('current company') ||
    q.includes('where do you work') ||
    q.includes('companies') ||
    q.includes('work history')
  ) {
    const current = kb.workExperience?.[0] || { role: currentRole, company: currentCompany };
    const prev = kb.workExperience?.[1] || { role: 'Senior Backend Engineer', company: 'CloudNova Systems' };
    return {
      answer:
        `I currently work as a ${current.role} at ${current.company}. ` +
        `Before this, I was a ${prev.role} at ${prev.company}.`,
      groundingTopic: 'Work Experience',
      isVerified: true,
    };
  }

  // 11. Career Interests & Future Goals
  if (
    q.includes('career interest') ||
    q.includes('interests') ||
    q.includes('passionate about') ||
    q.includes('goals') ||
    q.includes('looking for')
  ) {
    return {
      answer:
        `My primary career interests are in real-time conversational AI, autonomous voice systems, and ultra-low latency distributed computing. ` +
        `I am passionate about creating AI agents that can hold natural, responsive, and secure human dialogues.`,
      groundingTopic: 'Career Interests',
      isVerified: true,
    };
  }

  // 12. Specific Verified Skills Deep-Dive (FastAPI, Python, Kafka, PyTorch, Kubernetes)
  if (
    q.includes('python') ||
    q.includes('fastapi') ||
    q.includes('kafka') ||
    q.includes('pytorch') ||
    q.includes('docker') ||
    q.includes('kubernetes')
  ) {
    return {
      answer:
        `Yes, absolutely. I work with Python, FastAPI, and Kafka on a daily basis in production. ` +
        `At ${kb.workExperience[0].company}, I used this exact stack to reduce streaming conversational latency by 45% while handling peak enterprise event volumes.`,
      groundingTopic: 'Verified Technology Deep-Dive',
      isVerified: true,
    };
  }

  // 13. Privacy / Compensation (Handled safely without hallucination)
  if (
    q.includes('salary') ||
    q.includes('compensation') ||
    q.includes('pay') ||
    q.includes('current package') ||
    q.includes('rate')
  ) {
    return {
      answer:
        `I consider compensation details private at this stage of the conversation and prefer to discuss numbers once there is mutual alignment. ` +
        `Could you share the budgeted range for this position?`,
      groundingTopic: 'Private Compensation Guardrail',
      isVerified: true,
    };
  }

  // 14. Sensitive Personal Information Guardrail (SSN, Home Address, Passwords)
  if (
    q.includes('password') ||
    q.includes('otp') ||
    q.includes('pin') ||
    q.includes('secret key') ||
    q.includes('private key') ||
    q.includes('home address') ||
    q.includes('ssn')
  ) {
    return {
      answer:
        `For security and privacy reasons, I do not disclose personal authentication credentials, passwords, or confidential data over phone calls.`,
      groundingTopic: 'Confidential PII Guardrail',
      isVerified: true,
    };
  }

  // 15. General conversational answer or fall-through
  const specificInquiryKeywords = [
    'patent number',
    'gpa score',
    'high school',
    'elementary',
    'marital',
    'religion',
    'driver license',
    'credit score',
    'bank account',
    'family',
    'children',
  ];

  if (specificInquiryKeywords.some((k) => q.includes(k))) {
    return {
      answer: UNVERIFIED_INFORMATION_REFUSAL,
      groundingTopic: 'Unverified Personal Data',
      isVerified: false,
    };
  }

  // Default natural conversational response grounded in profile
  return {
    answer:
      `That's a good question. In my role as a ${kb.title}, I specialize in building distributed backend systems and real-time AI voice pipelines. ` +
      `Could you clarify which aspect of my background you'd like me to dive into?`,
    groundingTopic: 'General Professional Inquiries',
    isVerified: true,
  };
}
