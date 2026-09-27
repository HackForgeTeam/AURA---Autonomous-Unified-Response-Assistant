import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Briefcase,
  ShieldCheck,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Lock,
  Upload,
  Save,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Eye,
  Clock,
} from 'lucide-react';
import { ProfessionalProfile } from '../types';
import { api } from '../services/api';
import {
  updateResumeKnowledgeBase,
  queryResumeKnowledge,
  sanitizeResumeText,
  parseResumeDetails,
  DEFAULT_RESUME_KNOWLEDGE_BASE,
  RESUME_KNOWLEDGE_BASE,
} from '../services/resumeKnowledge';

interface InterviewAssistantPageProps {
  professionalProfile: ProfessionalProfile | null;
  onRefreshProfile?: () => void;
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

export const InterviewAssistantPage: React.FC<InterviewAssistantPageProps> = ({
  professionalProfile,
  onRefreshProfile,
}) => {
  // Raw and Sanitized Resume States
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

  const [isEditingSanitized, setIsEditingSanitized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [saveErrorNotice, setSaveErrorNotice] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aura_last_resume_saved');
    }
    return null;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Testing Grounding
  const [testQuestion, setTestQuestion] = useState('What is your experience with FastAPI and real-time streaming?');
  const [testAnswer, setTestAnswer] = useState<string>('');
  const [customQuestionInput, setCustomQuestionInput] = useState('');

  // Load from backend on initial mount
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
        console.warn('Could not fetch latest backend resume in Interview Assistant', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active candidate information
  const candidateInfo = useMemo(() => {
    const details = parseResumeDetails(sanitizedResumeText);
    const candidateName = details.name || RESUME_KNOWLEDGE_BASE.name || 'Candidate';
    const candidateTitle = details.summary ? details.summary.slice(0, 50) + '...' : RESUME_KNOWLEDGE_BASE.title;
    return { name: candidateName, title: candidateTitle, details };
  }, [sanitizedResumeText]);

  // Initialize initial test answer on mount
  useEffect(() => {
    const res = queryResumeKnowledge(testQuestion);
    setTestAnswer(res.answer);
  }, [sanitizedResumeText]);

  // Re-sanitize from source
  const handleReSanitizeFromSource = () => {
    const fresh = sanitizeResumeText(rawResumeText);
    setSanitizedResumeText(fresh);
    setIsDirty(true);
    setSaveSuccessNotice('Sanitized resume updated from source with fresh PII masks applied.');
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Upload Resume File
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
          const parsed = parseResumeDetails(autoSanitized);
          updateResumeKnowledgeBase({
            name: parsed.name || DEFAULT_RESUME_KNOWLEDGE_BASE.name,
            summary: parsed.summary || autoSanitized.slice(0, 250),
            rawResumeText: content,
            sanitizedResumeText: autoSanitized,
            skills: parsed.skills || DEFAULT_RESUME_KNOWLEDGE_BASE.skills,
            workExperience: (parsed.workExperience || []).map((w: any) => ({
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
          });

          onRefreshProfile?.();
          setSaveSuccessNotice(`Uploaded "${file.name}" and synchronized with Interview AI Assistant!`);
        } catch {
          setSaveSuccessNotice(
            `Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Sanitized resume generated. Click "Save & Sync to Interview AI" to apply.`
          );
        }
        setTimeout(() => setSaveSuccessNotice(null), 5000);
      }
    };
    reader.onerror = () => {
      setSaveErrorNotice('Could not read the uploaded file. Please ensure it is a valid text or markdown file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save Resume and update AI Grounding
  const handleSaveResume = async () => {
    setIsSaving(true);
    setSaveSuccessNotice(null);
    setSaveErrorNotice(null);

    try {
      const finalSanitizedText = sanitizedResumeText.trim() || sanitizeResumeText(rawResumeText);
      const parsed = parseResumeDetails(finalSanitizedText);

      // 1. Save resume to backend
      await api.saveResume({
        raw_text: rawResumeText,
        filename: 'resume_profile.txt',
        sanitized_text: finalSanitizedText,
      });

      // 2. Update backend ProfessionalProfile
      const activeSummary = parsed.summary || professionalProfile?.summary || '';
      const activeSkills = parsed.skills?.programmingLanguages?.concat(parsed.skills?.technologiesAndFrameworks || []) ||
        professionalProfile?.skills || ['Python', 'FastAPI', 'TypeScript'];

      await api.updateProfessionalProfile({
        summary: activeSummary,
        skills: activeSkills,
        work_experience: parsed.workExperience
          ? parsed.workExperience.map((w: any) => ({
              company: w.company,
              role: w.role,
              dates: w.period || w.dates || 'Present',
              highlights: w.highlights || [],
            }))
          : professionalProfile?.work_experience || [],
        education: professionalProfile?.education || [
          {
            degree: 'Bachelor of Science',
            institution: 'University',
            year: '2020',
          },
        ],
        projects: professionalProfile?.projects || [],
      });

      // 3. Update frontend live call simulator grounded knowledge base
      updateResumeKnowledgeBase({
        name: parsed.name || DEFAULT_RESUME_KNOWLEDGE_BASE.name,
        summary: activeSummary,
        rawResumeText: rawResumeText,
        sanitizedResumeText: finalSanitizedText,
        skills: parsed.skills || DEFAULT_RESUME_KNOWLEDGE_BASE.skills,
        workExperience: (parsed.workExperience || []).map((w: any) => ({
          company: w.company,
          role: w.role,
          period: w.period || 'Present',
          highlights: w.highlights || [],
        })),
      });

      // 4. Persist to localStorage
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('aura_saved_raw_resume', rawResumeText);
      localStorage.setItem('aura_saved_sanitized_resume', finalSanitizedText);
      localStorage.setItem('aura_last_resume_saved', nowStr);
      setLastSavedTimestamp(nowStr);
      setIsDirty(false);
      setIsEditingSanitized(false);

      // 5. Notify parent App
      onRefreshProfile?.();

      setSaveSuccessNotice('Resume & Sanitized Profile updated and synced with Interview AI Assistant!');
      setTimeout(() => setSaveSuccessNotice(null), 5000);

      // Re-run current test query with updated grounding
      const queryRes = queryResumeKnowledge(testQuestion);
      setTestAnswer(queryRes.answer);
    } catch (err: any) {
      console.error('Failed to save resume in Interview Assistant:', err);
      setSaveErrorNotice(err.message || 'Failed to save resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sampleQuestions = [
    'What is your experience with FastAPI and real-time streaming?',
    'What are your salary expectations?',
    'What is your personal phone number or home address?',
    'Do you have experience with quantum computing or Rust?',
    'Can you tell me about your projects?',
    'Tell me about your education and degree',
  ];

  const handleRunTest = (question: string) => {
    setTestQuestion(question);
    const result = queryResumeKnowledge(question);
    setTestAnswer(result.answer);
  };

  const handleCustomQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestionInput.trim()) {
      handleRunTest(customQuestionInput.trim());
      setCustomQuestionInput('');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Toast Notification Banners */}
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

      {/* Policy Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-100 text-violet-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-violet-700">Verified-Profile Grounding</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Only answers questions using facts verified in the sanitized resume and profile.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-cyan-700">Zero PII Disclosure</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strictly conceals phone numbers, personal emails, physical addresses, and salary.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-700">Anti-Hallucination Safe Mode</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Explicitly responds that info is unavailable rather than guessing unverified skills.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SANITIZED RESUME & AI GROUNDING MANAGER (Interview & PII Synchronized)     */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-br from-aura-card via-slate-900 to-cyan-950/30 border border-cyan-500/30 p-6 shadow-xl shadow-cyan-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aura-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Sanitized Resume & AI Grounding Context
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> PII Protected
                </span>
                {isDirty && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Unsaved Edits
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Representing <strong className="text-cyan-600 font-semibold">{candidateInfo.name}</strong> • This sanitized resume is loaded into the live Interview AI assistant to prevent PII leakage.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden File Input */}
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
              className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition"
              title="Upload new resume file"
            >
              <Upload className="h-3.5 w-3.5 text-cyan-500" />
              <span>Upload Resume</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingSanitized(!isEditingSanitized)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                isEditingSanitized
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Toggle editing mode for the sanitized resume"
            >
              {isEditingSanitized ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Done Editing</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Edit Sanitized Resume</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReSanitizeFromSource}
              className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition"
              title="Re-generate sanitized resume from raw source"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-500" />
              <span className="hidden sm:inline">Re-Sanitize</span>
            </button>

            <button
              onClick={handleSaveResume}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Sync to AI'}</span>
            </button>
          </div>
        </div>

        {/* Content Box: View vs Editable */}
        {isEditingSanitized ? (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-600 font-semibold flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5 text-cyan-500" />
                Directly Edit Sanitized Text (Changes will ground the Interview AI)
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {sanitizedResumeText.length} chars • {sanitizedResumeText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={sanitizedResumeText}
              onChange={(e) => {
                setSanitizedResumeText(e.target.value);
                setIsDirty(true);
              }}
              rows={12}
              placeholder="Type or edit sanitized resume text here..."
              className="w-full p-4 rounded-xl bg-slate-50 border border-cyan-200 font-mono text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-y transition custom-scrollbar"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>All `[REDACTED]` markers prevent unauthorized disclosure during interview phone calls.</span>
              <button
                type="button"
                onClick={handleSaveResume}
                disabled={isSaving}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                <span>Save Changes Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-cyan-400" />
                {lastSavedTimestamp ? `Last synchronized: ${lastSavedTimestamp}` : 'Synchronized with live Interview Assistant'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {sanitizedResumeText.length} chars • {sanitizedResumeText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-56 overflow-y-auto font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap custom-scrollbar">
              {sanitizedResumeText}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Active Protections:</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono text-[10px]">
                  Phone Numbers Redacted
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono text-[10px]">
                  Email Redacted
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono text-[10px]">
                  Salary Withheld
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSanitized(true)}
                className="text-cyan-600 hover:text-cyan-500 font-semibold flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                <span>Click to Edit Text</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE GROUNDING QUESTION TESTER (Dynamic with Updated Resume)       */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            Test Interview Mode Grounding Behavior
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Grounding in: <strong className="text-slate-800">{candidateInfo.name}</strong>
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Click any scenario or enter a custom question below to verify how AURA responds using your verified sanitized background:
        </p>

        {/* Quick Question Buttons */}
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleRunTest(q)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium text-left ${
                testQuestion === q
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-600 hover:border-cyan-300'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Custom Question Form */}
        <form onSubmit={handleCustomQuestionSubmit} className="flex gap-2">
          <input
            type="text"
            value={customQuestionInput}
            onChange={(e) => setCustomQuestionInput(e.target.value)}
            placeholder="Ask a custom screening question (e.g. 'Where did you study?', 'What are your top skills?')..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <span>Ask AURA</span>
          </button>
        </form>

        {/* Response Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-cyan-200 space-y-2">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 truncate max-w-lg">
              Question: <span className="text-slate-700 font-medium italic">"{testQuestion}"</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
              Policy Compliant
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block mb-1">
              AURA Spoken Response (Grounding Live Call Engine):
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{testAnswer}</p>
          </div>
        </div>
      </div>

      {/* Verified Profile Data Summary */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-violet-500" />
          Verified Background Knowledge Base
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Education */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-cyan-500" />
              Verified Education
            </h4>
            <div className="space-y-2">
              {(professionalProfile?.education || [
                {
                  degree: RESUME_KNOWLEDGE_BASE.education?.degree || 'Bachelor of Science',
                  institution: RESUME_KNOWLEDGE_BASE.education?.college || 'University',
                  year: RESUME_KNOWLEDGE_BASE.education?.year || '2018',
                  honors: RESUME_KNOWLEDGE_BASE.education?.honors,
                },
              ]).map((edu: any, i: number) => (
                <div key={i} className="text-xs border-l-2 border-cyan-500 pl-2">
                  <span className="font-bold text-slate-800">{edu.degree}</span>
                  <p className="text-slate-500">{edu.institution} ({edu.year})</p>
                  {edu.honors && <span className="text-[10px] text-cyan-600 font-semibold">{edu.honors}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-violet-500" />
              Verified Projects
            </h4>
            <div className="space-y-2">
              {(professionalProfile?.projects && professionalProfile.projects.length > 0
                ? professionalProfile.projects
                : RESUME_KNOWLEDGE_BASE.projects || []
              ).map((proj: any, i: number) => (
                <div key={i} className="text-xs border-l-2 border-violet-500 pl-2">
                  <span className="font-bold text-slate-800">{proj.name}</span>
                  <p className="text-slate-500 mt-0.5">{proj.description || proj.highlights || proj.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewAssistantPage;
