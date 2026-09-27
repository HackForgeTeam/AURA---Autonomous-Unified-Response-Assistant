import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  EyeOff,
  Sparkles,
  Lock,
  RefreshCw,
  Save,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Edit3,
  Clock,
  Briefcase
} from 'lucide-react';
import { ProfessionalProfile } from '../types';
import { api } from '../services/api';
import {
  updateResumeKnowledgeBase,
  resetResumeKnowledgeBase,
  DEFAULT_RESUME_KNOWLEDGE_BASE,
  sanitizeResumeText,
  parseResumeDetails,
} from '../services/resumeKnowledge';

interface ResumePageProps {
  professionalProfile: ProfessionalProfile | null;
  onRefreshProfile: () => void;
}

const DEFAULT_SAMPLE_RESUME = `ALEX CHEN
1428 Elmwood Terrace, Apt 4B, Palo Alto, CA 94301
Phone: (555) 901-2345 | Mobile: +1-555-888-9999
Email: alex.chen.private@gmail.com | SSN: ***-**-6789 | DOB: 1996-04-12
LinkedIn: linkedin.com/in/alexchen-private

SUMMARY
Experienced Staff AI Systems Engineer with 8+ years architecting fault-tolerant backend microservices, real-time streaming pipelines, and production LLM orchestration.

SKILLS
Python, FastAPI, Go, TypeScript, React, SQLAlchemy, PostgreSQL, Kafka, Docker, Kubernetes, PyTorch, LangChain

EXPERIENCE
Staff AI Engineer — Cognitive Dynamics (2022 - Present)
• Architected high-throughput agentic workflows serving 10M+ daily events.
• Reduced conversational latency by 45% using streaming WebSockets and speculative execution.
• Base compensation: $285k + equity (CONFIDENTIAL)

Senior Backend Engineer — CloudNova Systems (2019 - 2022)
• Designed distributed data ingestion pipeline handling 50k RPS.
• Migrated legacy monolith to containerized FastAPI microservices.

EDUCATION
B.S. in Computer Science — UC Berkeley (2018), Magna Cum Laude`;

export const ResumePage: React.FC<ResumePageProps> = ({
  professionalProfile,
  onRefreshProfile,
}) => {
  const [rawResumeText, setRawResumeText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_saved_raw_resume');
      if (saved) return saved;
    }
    return DEFAULT_SAMPLE_RESUME;
  });

  const [sanitizedResumeText, setSanitizedResumeText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedSanitized = localStorage.getItem('aura_saved_sanitized_resume');
      if (savedSanitized) return savedSanitized;
      const savedRaw = localStorage.getItem('aura_saved_raw_resume');
      if (savedRaw) return sanitizeResumeText(savedRaw);
    }
    return sanitizeResumeText(DEFAULT_SAMPLE_RESUME);
  });

  const [rightColumnTab, setRightColumnTab] = useState<'document' | 'structured'>('document');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [saveErrorNotice, setSaveErrorNotice] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aura_last_resume_saved');
    }
    return null;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isEditingStructured, setIsEditingStructured] = useState(false);
  const [customSummary, setCustomSummary] = useState<string>('');
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize structured fields from profile
  useEffect(() => {
    if (professionalProfile) {
      setCustomSummary(professionalProfile.summary || '');
      setCustomSkills(professionalProfile.skills || []);
    }
  }, [professionalProfile]);

  // Load from backend on initial mount if available
  useEffect(() => {
    let isMounted = true;
    api.getLatestResume()
      .then((savedResume) => {
        if (isMounted && savedResume?.raw_text) {
          setRawResumeText(savedResume.raw_text);
          localStorage.setItem('aura_saved_raw_resume', savedResume.raw_text);
          if (savedResume.sanitized_text) {
            setSanitizedResumeText(savedResume.sanitized_text);
            localStorage.setItem('aura_saved_sanitized_resume', savedResume.sanitized_text);
          } else {
            const autoSanitized = sanitizeResumeText(savedResume.raw_text);
            setSanitizedResumeText(autoSanitized);
            localStorage.setItem('aura_saved_sanitized_resume', autoSanitized);
          }
          if (savedResume.created_at) {
            const dateStr = new Date(savedResume.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            setLastSavedTimestamp(dateStr);
            localStorage.setItem('aura_last_resume_saved', dateStr);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch latest backend resume, using local storage fallback', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time dynamic PII detection scanner
  const detectedPII = useMemo(() => {
    const text = rawResumeText;

    // 1. Phone Numbers
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneMatches = text.match(phoneRegex) || [];

    // 2. Email Addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = text.match(emailRegex) || [];

    // 3. Physical Address hints
    const addressRegex = /\b\d{1,5}\s+[A-Za-z0-9\s.,]+(?:Terrace|Street|Avenue|Road|Drive|Lane|Boulevard|Apt|Suite|CA|NY|WA|TX|FL|9\d{4})\b[^\n]*/gi;
    const addressMatches = text.match(addressRegex) || [];

    // 4. SSN / Govt ID
    const ssnRegex = /\b(?:\d{3}-\d{2}-\d{4}|\*{3}-\*{2}-\d{4})\b/g;
    const ssnMatches = text.match(ssnRegex) || [];

    // 5. Date of Birth
    const dobRegex = /\b(?:DOB|Date of Birth|Birthdate)[:\s]*\d{4}[-/]\d{2}[-/]\d{2}\b/gi;
    const dobMatches = text.match(dobRegex) || [];

    // 6. Salary / Compensation
    const salaryRegex = /(?:\$[\d,]+k?(?:\s*\+\s*equity|\s*\/yr|\s*base)?|\b\d{2,3}k\b|salary|compensation)[^\n]*/gi;
    const salaryMatches = text.match(salaryRegex) || [];

    const totalCount =
      phoneMatches.length +
      emailMatches.length +
      addressMatches.length +
      ssnMatches.length +
      dobMatches.length +
      salaryMatches.length;

    const items = [
      {
        type: 'Phone Numbers',
        found: phoneMatches.length > 0,
        count: phoneMatches.length,
        sample: phoneMatches.length > 0 ? phoneMatches.join(', ') : 'None detected',
        action: phoneMatches.length > 0 ? 'REDACTED' : 'CLEAN',
        status: phoneMatches.length > 0 ? 'Blocked from AI' : 'Safe',
      },
      {
        type: 'Email Address',
        found: emailMatches.length > 0,
        count: emailMatches.length,
        sample: emailMatches.length > 0 ? emailMatches.join(', ') : 'None detected',
        action: emailMatches.length > 0 ? 'REDACTED' : 'CLEAN',
        status: emailMatches.length > 0 ? 'Blocked from AI' : 'Safe',
      },
      {
        type: 'Physical Address',
        found: addressMatches.length > 0,
        count: addressMatches.length,
        sample: addressMatches.length > 0 && addressMatches[0] ? addressMatches[0].trim() : 'None detected',
        action: addressMatches.length > 0 ? 'REDACTED' : 'CLEAN',
        status: addressMatches.length > 0 ? 'Blocked from AI' : 'Safe',
      },
      {
        type: 'Government ID / SSN',
        found: ssnMatches.length > 0,
        count: ssnMatches.length,
        sample: ssnMatches.length > 0 ? ssnMatches.join(', ') : 'None detected',
        action: ssnMatches.length > 0 ? 'REDACTED' : 'CLEAN',
        status: ssnMatches.length > 0 ? 'Blocked from AI' : 'Safe',
      },
      {
        type: 'Date of Birth',
        found: dobMatches.length > 0,
        count: dobMatches.length,
        sample: dobMatches.length > 0 ? dobMatches.join(', ') : 'None detected',
        action: dobMatches.length > 0 ? 'REDACTED' : 'CLEAN',
        status: dobMatches.length > 0 ? 'Blocked from AI' : 'Safe',
      },
      {
        type: 'Salary / Compensation',
        found: salaryMatches.length > 0,
        count: salaryMatches.length,
        sample: salaryMatches.length > 0 && salaryMatches[0] ? salaryMatches[0].trim() : 'None detected',
        action: salaryMatches.length > 0 ? 'WITHHELD' : 'CLEAN',
        status: salaryMatches.length > 0 ? 'Non-disclosable' : 'Safe',
      },
    ];

    return { totalCount, items };
  }, [rawResumeText]);

  // Structured parser that extracts sanitized profile sections from raw resume
  const parsedProfile = useMemo(() => {
    const text = rawResumeText;
    const lines = text.split('\n');

    // Extract Summary
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

    // Extract Skills
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

    // Extract Experience items
    const expItems: Array<{ role: string; company: string; dates: string; highlights: string[] }> = [];
    const expIdx = lines.findIndex((l) => /^(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY)/i.test(l.trim()));
    if (expIdx !== -1) {
      let currentItem: { role: string; company: string; dates: string; highlights: string[] } | null = null;
      for (let i = expIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^(EDUCATION|PROJECTS|CERTIFICATIONS|SKILLS)/i.test(line)) break;
        if (!line) continue;

        // Check if role line like "Staff AI Engineer — Cognitive Dynamics (2022 - Present)"
        if (line.includes('—') || line.includes('-') || line.includes(' at ')) {
          if (currentItem) expItems.push(currentItem);
          const parts = line.split(/[—\-]/);
          const role = parts[0]?.trim() || 'Software Engineer';
          const rest = parts.slice(1).join('—').trim();
          const datesMatch = rest.match(/\((.*?)\)/);
          const dates = datesMatch ? datesMatch[1] : 'Present';
          const company = rest.replace(/\(.*?\)/, '').trim() || 'Technology Co.';
          currentItem = { role, company, dates, highlights: [] };
        } else if (currentItem && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
          // If line contains confidential salary, mask it
          if (!/compensation|salary|\$|equity/i.test(line)) {
            currentItem.highlights.push(line.replace(/^[•\-*]\s*/, ''));
          }
        }
      }
      if (currentItem) expItems.push(currentItem);
    }

    // Fallbacks if not structured
    const fallbackSummary =
      summary ||
      customSummary ||
      professionalProfile?.summary ||
      'Experienced Software Engineer specializing in backend architecture, AI systems, and cloud infrastructure.';

    const fallbackSkills =
      skills.length > 0
        ? skills
        : customSkills.length > 0
        ? customSkills
        : professionalProfile?.skills || ['Python', 'FastAPI', 'TypeScript', 'React', 'SQL', 'Docker'];

    const fallbackExp =
      expItems.length > 0
        ? expItems
        : professionalProfile?.work_experience || [
            {
              role: 'Staff AI Engineer',
              company: 'Cognitive Dynamics',
              dates: '2022 - Present',
              highlights: ['Architected real-time streaming pipelines.'],
            },
          ];

    return {
      summary: fallbackSummary,
      skills: fallbackSkills,
      work_experience: fallbackExp,
    };
  }, [rawResumeText, customSummary, customSkills, professionalProfile]);

  // Re-sanitize from source
  const handleReSanitizeFromSource = () => {
    const fresh = sanitizeResumeText(rawResumeText);
    setSanitizedResumeText(fresh);
    setIsDirty(true);
    setSaveSuccessNotice('Sanitized resume regenerated from source with latest PII redactions applied.');
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Handle saving the resume and updating the profile
  const handleSaveResume = async () => {
    setIsSaving(true);
    setSaveSuccessNotice(null);
    setSaveErrorNotice(null);

    try {
      // 1. Generate / verify sanitized text (with PII masked)
      const finalSanitizedText = sanitizedResumeText.trim() || sanitizeResumeText(rawResumeText);

      // 2. Persist raw and sanitized resume in backend
      await api.saveResume({
        raw_text: rawResumeText,
        filename: 'resume_profile.txt',
        sanitized_text: finalSanitizedText,
        pii_detected: {
          totalCount: detectedPII.totalCount,
          items: detectedPII.items.map((it) => ({ type: it.type, count: it.count, action: it.action })),
        },
      });

      // 3. Update backend ProfessionalProfile
      const activeSummary = customSummary.trim() || parsedProfile.summary;
      const activeSkills = customSkills.length > 0 ? customSkills : parsedProfile.skills;

      await api.updateProfessionalProfile({
        summary: activeSummary,
        skills: activeSkills,
        work_experience: parsedProfile.work_experience,
        education: professionalProfile?.education || [
          {
            degree: 'Bachelor of Science',
            institution: 'University',
            year: '2020',
          },
        ],
        projects: professionalProfile?.projects || [],
      });

      // 4. Update frontend live call simulator grounded knowledge base
      const parsedDetails = parseResumeDetails(finalSanitizedText);
      updateResumeKnowledgeBase({
        name: parsedDetails.name || DEFAULT_RESUME_KNOWLEDGE_BASE.name,
        summary: activeSummary,
        rawResumeText: rawResumeText,
        sanitizedResumeText: finalSanitizedText,
        skills: {
          programmingLanguages: activeSkills.slice(0, 8),
          technologiesAndFrameworks: activeSkills.slice(8, 16),
          infrastructureAndCloud: ['Cloud Infrastructure', 'WebSockets', 'Kafka', 'PostgreSQL'],
          architecture: ['Distributed Systems', 'Real-time Voice AI', 'Zero-Trust Security'],
        },
        workExperience: parsedProfile.work_experience.map((w: any) => ({
          company: w.company,
          role: w.role,
          period: w.dates,
          highlights: w.highlights || [],
        })),
      });

      // 5. Persist locally
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('aura_saved_raw_resume', rawResumeText);
      localStorage.setItem('aura_saved_sanitized_resume', finalSanitizedText);
      localStorage.setItem('aura_last_resume_saved', nowStr);
      setLastSavedTimestamp(nowStr);
      setIsDirty(false);

      // 6. Refresh parent App state
      onRefreshProfile();

      setSaveSuccessNotice('Resume & Sanitized Profile saved successfully! Grounding AI assistant is synchronized.');
      setTimeout(() => setSaveSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed to save resume:', err);
      setSaveErrorNotice(err.message || 'Failed to save resume to backend. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Re-run sanitization simulation
  const handleSimulateExtraction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      handleReSanitizeFromSource();
      onRefreshProfile();
    }, 600);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawResumeText(content);
        const autoSanitized = sanitizeResumeText(content);
        setSanitizedResumeText(autoSanitized);
        setIsDirty(true);

        // Immediately persist to localStorage so Live Call always has access to the uploaded resume
        try {
          localStorage.setItem('aura_saved_raw_resume', content);
          localStorage.setItem('aura_saved_sanitized_resume', autoSanitized);
        } catch (storageErr) {
          console.warn('LocalStorage save failed:', storageErr);
        }

        // Auto-sync with runtime knowledge base and backend
        try {
          const parsedDetails = parseResumeDetails(autoSanitized);
          updateResumeKnowledgeBase({
            name: parsedDetails.name || DEFAULT_RESUME_KNOWLEDGE_BASE.name,
            summary: parsedDetails.summary || autoSanitized.slice(0, 250),
            rawResumeText: content,
            sanitizedResumeText: autoSanitized,
            skills: parsedDetails.skills || DEFAULT_RESUME_KNOWLEDGE_BASE.skills,
            workExperience: (parsedDetails.workExperience || []).map((w: any) => ({
              company: w.company,
              role: w.role,
              period: w.period || 'Present',
              highlights: w.highlights || [],
            })),
          });

          await api.saveResume({
            raw_text: content,
            filename: file.name,
            sanitized_text: autoSanitized,
            pii_detected: {
              totalCount: detectedPII.totalCount,
              items: detectedPII.items.map((it) => ({ type: it.type, count: it.count, action: it.action })),
            },
          });

          onRefreshProfile();
          setSaveSuccessNotice(`Uploaded "${file.name}" and synchronized with AI representative!`);
        } catch {
          setSaveSuccessNotice(`Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Sanitized resume generated. Click "Save Resume" to finalize.`);
        }
        setTimeout(() => setSaveSuccessNotice(null), 5000);
      }
    };
    reader.onerror = () => {
      setSaveErrorNotice('Could not read the uploaded file. Please ensure it is a valid text or markdown file.');
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  // Reset to default sample Alex Chen resume
  const handleResetToDemo = () => {
    if (window.confirm('Reset resume to default demo profile (Alex Chen)? Any unsaved edits will be replaced.')) {
      setRawResumeText(DEFAULT_SAMPLE_RESUME);
      setSanitizedResumeText(sanitizeResumeText(DEFAULT_SAMPLE_RESUME));
      setCustomSummary(DEFAULT_RESUME_KNOWLEDGE_BASE.summary);
      setCustomSkills(DEFAULT_RESUME_KNOWLEDGE_BASE.skills.programmingLanguages.concat(DEFAULT_RESUME_KNOWLEDGE_BASE.skills.technologiesAndFrameworks));
      resetResumeKnowledgeBase();
      setIsDirty(true);
      setSaveSuccessNotice('Reset to default demo resume. Click "Save Resume" to apply to database.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }
  };

  // Skill tag add/remove
  const handleAddSkill = () => {
    const trimmed = newSkillText.trim();
    if (trimmed && !customSkills.includes(trimmed)) {
      const updated = [...customSkills, trimmed];
      setCustomSkills(updated);
      setNewSkillText('');
      setIsDirty(true);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCustomSkills((prev) => prev.filter((s) => s !== skillToRemove));
    setIsDirty(true);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Toast Notification Banner */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold">{saveSuccessNotice}</p>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {saveErrorNotice && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center justify-between gap-3 shadow-lg shadow-rose-950/40">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <p className="text-xs font-semibold">{saveErrorNotice}</p>
          </div>
          <button
            onClick={() => setSaveErrorNotice(null)}
            className="text-rose-400 hover:text-rose-200 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Privacy Guarantee & Quick Actions Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-50 via-white to-violet-50 border border-cyan-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">Resume Privacy & PII Redaction Pipeline</h3>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Zero PII Leakage
              </span>
              {lastSavedTimestamp && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  Last saved: {lastSavedTimestamp}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Before your professional background is loaded into the Interview Assistant, our pipeline extracts and masks sensitive PII.
              Edit or paste your resume below and click <strong className="text-cyan-600 font-semibold">Save Resume</strong> to ground the AI assistant in your verified qualifications.
            </p>
          </div>
        </div>

        {/* Banner Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={handleSaveResume}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
            title="Save your resume and sync with the AI assistant"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-bounce' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Resume'}</span>
          </button>

          <button
            onClick={handleSimulateExtraction}
            disabled={isProcessing}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            title="Re-run sanitization audit"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Sanitizing...' : 'Update & Re-Sanitize'}</span>
          </button>

          <button
            onClick={handleResetToDemo}
            className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 text-xs flex items-center gap-1.5 transition"
            title="Reset to default Alex Chen demo profile"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* PII Detection Audit Grid (Dynamic Real-Time Scanning) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-cyan-500" />
            Active Redaction Rules (Automated PII Masking)
          </h3>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white border border-slate-200 text-cyan-600 font-semibold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            {detectedPII.totalCount} PII {detectedPII.totalCount === 1 ? 'item' : 'items'} detected & masked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {detectedPII.items.map((item, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl bg-white border transition-all ${
                item.found
                  ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50'
                  : 'border-slate-200'
              } flex items-start justify-between gap-3`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 truncate">{item.type}</span>
                  {item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                      {item.count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1 truncate" title={item.sample}>
                  {item.sample}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold mt-2.5 px-2 py-0.5 rounded border ${
                    item.found
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      : 'text-slate-500 bg-slate-50 border-slate-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 ${
                  item.found
                    ? 'bg-rose-100 text-rose-600 border border-rose-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {item.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side: Source Resume Editor vs Sanitized AI Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Source Resume (Raw Text & Upload) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col h-[560px] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Source Resume (Raw Text)
              </h4>
              {isDirty && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unsaved Changes
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {rawResumeText.length} chars • {rawResumeText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          {/* Textarea for editing resume */}
          <textarea
            value={rawResumeText}
            onChange={(e) => {
              const updated = e.target.value;
              setRawResumeText(updated);
              setSanitizedResumeText(sanitizeResumeText(updated));
              setIsDirty(true);
            }}
            placeholder="Paste or type your resume here (Summary, Skills, Work Experience, Education)..."
            className="flex-1 w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none transition"
          />

          {/* Editor Action Bottom Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md,.text"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Upload className="h-3.5 w-3.5 text-cyan-400" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDemo}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-medium border border-slate-200 transition"
              >
                Sample
              </button>
            </div>

            {/* Bottom Save Resume Button */}
            <button
              onClick={handleSaveResume}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Resume'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sanitized Resume & Profile for AI Grounding */}
        <div className="rounded-2xl bg-white border border-cyan-200 p-5 flex flex-col h-[560px] shadow-sm">
          {/* Header with View Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-500 shrink-0" />
              <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRightColumnTab('document')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition ${
                    rightColumnTab === 'document'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>Sanitized Resume (Editable)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightColumnTab('structured')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition ${
                    rightColumnTab === 'structured'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Structured Profile</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {rightColumnTab === 'document' ? (
                <button
                  type="button"
                  onClick={handleReSanitizeFromSource}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition"
                  title="Re-generate sanitized text from raw source resume"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Re-Sanitize</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingStructured(!isEditingStructured)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                    isEditingStructured
                      ? 'bg-cyan-500/20 text-cyan-600 border-cyan-400'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
                  }`}
                  title="Fine-tune sanitized fields manually"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>{isEditingStructured ? 'Done' : 'Fine-Tune'}</span>
                </button>
              )}
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> PII Masked
              </span>
            </div>
          </div>

          {/* Tab 1: Sanitized Document View (Directly Editable) */}
          {rightColumnTab === 'document' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-cyan-600 font-semibold flex items-center gap-1.5">
                  <Edit3 className="h-3 w-3 text-cyan-500" />
                  Directly Editable Sanitized Resume
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {sanitizedResumeText.length} chars • {sanitizedResumeText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                All sensitive credentials have been replaced with redaction tags. You can edit this sanitized text directly below before saving.
              </p>
              <textarea
                value={sanitizedResumeText}
                onChange={(e) => {
                  setSanitizedResumeText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Sanitized resume text (editable)..."
                className="flex-1 w-full p-3.5 rounded-xl bg-slate-50 border border-cyan-200 font-mono text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none transition custom-scrollbar"
              />
            </div>
          ) : (
            /* Tab 2: Structured Profile Cards */
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {/* Fine-Tune Structured Fields Drawer (if opened) */}
              {isEditingStructured && (
                <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 space-y-3 mb-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-600 flex items-center gap-1.5">
                      <Edit3 className="h-3.5 w-3.5" />
                      Fine-Tune Sanitized Fields
                    </span>
                    <span className="text-[10px] text-slate-400">Directly edit AI representation</span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Sanitized Summary
                    </label>
                    <textarea
                      value={customSummary}
                      onChange={(e) => {
                        setCustomSummary(e.target.value);
                        setIsDirty(true);
                      }}
                      rows={3}
                      placeholder="Enter sanitized professional summary..."
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-sans focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Add Technical Skill
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                        placeholder="e.g. Next.js, Rust, Kubernetes..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sanitized Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-cyan-500" />
                  Sanitized Summary
                </span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  {customSummary.trim() || parsedProfile.summary}
                </p>
              </div>

              {/* Verified Technical Skills */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                    Verified Technical Skills ({(customSkills.length > 0 ? customSkills : parsedProfile.skills).length})
                  </span>
                  <span className="text-[10px] text-slate-500">Safe for Call AI</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(customSkills.length > 0 ? customSkills : parsedProfile.skills).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 flex items-center gap-1.5 group"
                    >
                      <span>{skill}</span>
                      {isEditingStructured && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-cyan-400/60 hover:text-rose-400 transition"
                          title={`Remove ${skill}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience & Roles */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-cyan-500" />
                  Verified Experience & Roles
                </span>
                <div className="mt-2.5 space-y-3">
                  {parsedProfile.work_experience.map((exp: any, idx: number) => (
                    <div key={idx} className="text-xs border-l-2 border-cyan-500 pl-3 py-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-slate-800">{exp.role}</span>
                        <span className="text-[10px] font-mono text-slate-400">{exp.dates}</span>
                      </div>
                      <span className="text-[11px] text-cyan-600 block mt-0.5">{exp.company}</span>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {exp.highlights.slice(0, 2).map((h: string, hIdx: number) => (
                            <li key={hIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                              <span className="text-cyan-500 leading-tight">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Anti-Hallucination & Safe Representation Footnote */}
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-[11px] text-violet-700 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                <span>
                  <strong>AURA Anti-Hallucination Policy:</strong> The live assistant will strictly answer caller questions using the verified facts above. Any queries regarding unverified skills or withheld compensation will be politely deferred without leaking PII.
                </span>
              </div>
            </div>
          )}

          {/* Right Column Bottom Action */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Synchronized with Interview AI
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReSanitizeFromSource}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync from Raw</span>
              </button>
              <button
                onClick={handleSaveResume}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-500/20"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Updating...' : 'Update & Save Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
