import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  ListChecks, 
  FileText, 
  BrainCircuit, 
  Volume2, 
  Copy, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings2, 
  Check, 
  HelpCircle,
  TrendingUp,
  Sparkles,
  Flame,
  GraduationCap,
  Printer,
  Compass,
  Layers,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Table,
  Timer,
  School,
  UserCheck
} from "lucide-react";

export interface DigitalLessonPlan {
  title?: string;
  subjectOrBook?: string;
  duration?: string;
  totalUnits?: string;
  recommendedDailyHours?: string;
  targetPace?: string;
  studyGoal?: string;
  targetAudience?: "both" | "student" | "teacher";
  teacherOverview?: string;
  studyGuidance?: {
    weeklySchedule?: string[];
    studyStrategies?: string[];
    pomodoroProtocol?: string;
    activeRecallCheckpoints?: string[];
  };
  units?: Array<{
    unitNumber?: number;
    name: string;
    duration: string;
    description: string;
    difficulty?: string;
    bloomLevel?: string;
    keyTerms?: string[];
    objectives?: string[];
    activities?: string[];
    teacherCadence?: string[];
    teachingStrategies?: string[];
    commonMisconceptions?: string[];
    formativeExitTicket?: string;
    selfAssessmentQuestions?: string[];
  }>;
  fullMarkdownPlan: string;
}

interface DigitalLessonPlanViewerProps {
  plan: DigitalLessonPlan;
  onOpenGuidanceModal?: () => void;
  onPlaySpeech?: () => void;
  isSpeaking?: boolean;
  isDarkMode?: boolean;
}

export const DigitalLessonPlanViewer: React.FC<DigitalLessonPlanViewerProps> = ({
  plan,
  onOpenGuidanceModal,
  onPlaySpeech,
  isSpeaking = false,
  isDarkMode = false
}) => {
  // Role Perspective: "student" vs "teacher" vs "syllabus"
  const [perspective, setPerspective] = useState<"student" | "teacher" | "syllabus">("student");
  const [activeTab, setActiveTab] = useState<"units" | "schedule" | "document" | "guidance">("units");
  const [copied, setCopied] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({});

  // Embedded Pomodoro Timer
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [timerPreset, setTimerPreset] = useState<25 | 50>(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      if (pomodoroMode === "focus") {
        setCompletedSessionsCount((c) => c + 1);
        setPomodoroMode("break");
        setTimeLeft(timerPreset === 25 ? 5 * 60 : 10 * 60);
      } else {
        setPomodoroMode("focus");
        setTimeLeft(timerPreset * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, pomodoroMode, timerPreset]);

  const setPreset = (preset: 25 | 50) => {
    setTimerPreset(preset);
    setIsTimerRunning(false);
    setPomodoroMode("focus");
    setTimeLeft(preset * 60);
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const toggleHint = (hintId: string) => {
    setExpandedHints((prev) => ({
      ...prev,
      [hintId]: !prev[hintId]
    }));
  };

  const handleCopy = async () => {
    if (!plan.fullMarkdownPlan) return;
    try {
      await navigator.clipboard.writeText(plan.fullMarkdownPlan);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadMarkdown = () => {
    if (!plan.fullMarkdownPlan) return;
    const blob = new Blob([plan.fullMarkdownPlan], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(plan.title || "academic-lesson-plan").toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Completion stats
  const totalUnitsCount = plan.units?.length || 1;
  const allUnitActivities = plan.units?.flatMap((u) => u.activities || []) || [];
  const totalActivityCount = Math.max(allUnitActivities.length, totalUnitsCount * 3);
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalActivityCount) * 100));

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Intelligent fallback generators for teacher fields if not explicitly provided
  const getTeacherCadence = (unit: any, uIdx: number) => {
    if (unit.teacherCadence && unit.teacherCadence.length > 0) return unit.teacherCadence;
    return [
      "10m Hook & Framing: Introduce real-world problem and anchor question",
      "25m Direct Instruction & Modeling: Explain core principles with worked proofs",
      "15m Collaborative Activity: Small-group problem set or case analysis",
      "10m Formative Synthesis: Exit ticket and check-for-understanding recap"
    ];
  };

  const getTeachingStrategies = (unit: any, uIdx: number) => {
    if (unit.teachingStrategies && unit.teachingStrategies.length > 0) return unit.teachingStrategies;
    return [
      "Guided Inquiry: Frame concepts through exploratory questions before formal notation",
      "Scaffolded Practice: Walk through standard solutions, then fade instructor prompts",
      "Peer Instruction: Have student pairs articulate key trade-offs to each other"
    ];
  };

  const getBloomLevel = (unit: any, uIdx: number) => {
    if (unit.bloomLevel) return unit.bloomLevel;
    const levels = ["Understand & Apply", "Analyze & Synthesize", "Evaluate & Create", "Apply & Problem Solve"];
    return levels[uIdx % levels.length];
  };

  const getExitTicket = (unit: any, uIdx: number) => {
    if (unit.formativeExitTicket) return unit.formativeExitTicket;
    if (unit.selfAssessmentQuestions && unit.selfAssessmentQuestions[0]) {
      return `Formative Check: ${unit.selfAssessmentQuestions[0]}`;
    }
    return "Exit Ticket: In 3 bullet points, summarize the primary mechanism and explain where it would fail in a production edge case.";
  };

  const getMisconceptions = (unit: any, uIdx: number) => {
    if (unit.commonMisconceptions && unit.commonMisconceptions.length > 0) return unit.commonMisconceptions;
    return [
      "Confusing high-level conceptual analogy with underlying mathematical/algorithmic invariants",
      "Overlooking boundary conditions or edge cases during early practice rounds",
      "Relying on passive reading rather than recreating proofs from first principles"
    ];
  };

  const getKeyTerms = (unit: any, uIdx: number) => {
    if (unit.keyTerms && unit.keyTerms.length > 0) return unit.keyTerms;
    return ["Core Architecture", "Foundational Invariant", "Algorithmic Workflow", "Evaluation Criteria"];
  };

  return (
    <div className={`w-full max-w-5xl mx-auto rounded-3xl border shadow-lg overflow-hidden transition-colors print:border-none print:shadow-none ${
      isDarkMode ? "bg-[#1E1E1C] border-[#383832] text-[#F5F5F0]" : "bg-white border-slate-200/90 text-slate-900"
    }`}>
      {/* 1. HERO HEADER WITH PERSPECTIVE SWITCH */}
      <div className={`p-6 sm:p-8 border-b print:border-b-2 ${
        isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-gradient-to-r from-sky-50/80 via-indigo-50/50 to-slate-50 border-slate-200"
      }`}>
        {/* Top Unboxed Metadata Bar (Zero-Pill Compliance) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#A1A194]">
            <span className="font-semibold text-sky-600 dark:text-sky-400">Digital Curriculum Architecture</span>
            <span aria-hidden="true">·</span>
            <span>{plan.duration || "4-Week Standard"}</span>
            <span aria-hidden="true">·</span>
            <span>{plan.recommendedDailyHours || "2 hrs/day"}</span>
            <span aria-hidden="true">·</span>
            <span>{totalUnitsCount} Units</span>
            {plan.targetPace && (
              <>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{plan.targetPace.replace("-", " ")}</span>
              </>
            )}
          </div>

          {/* Perspective Switcher: Student vs Teacher vs Syllabus */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-[#181816] rounded-xl border border-slate-300/60 dark:border-[#383832] print:hidden">
            <button
              type="button"
              onClick={() => setPerspective("student")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                perspective === "student"
                  ? "bg-white dark:bg-[#2A2A26] text-sky-700 dark:text-sky-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap size={14} />
              <span>Student View</span>
            </button>
            <button
              type="button"
              onClick={() => setPerspective("teacher")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                perspective === "teacher"
                  ? "bg-white dark:bg-[#2A2A26] text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <School size={14} />
              <span>Teacher View</span>
            </button>
            <button
              type="button"
              onClick={() => setPerspective("syllabus")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                perspective === "syllabus"
                  ? "bg-white dark:bg-[#2A2A26] text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Table size={14} />
              <span>Syllabus Grid</span>
            </button>
          </div>
        </div>

        {/* Title & Perspective Kicker */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {plan.title || "Academic Study Curriculum"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A194] leading-relaxed">
              {perspective === "student"
                ? "Self-paced study roadmap with execution checkpoints, active recall drills, and daily focus milestones."
                : perspective === "teacher"
                ? "Classroom instructional guide with pedagogical lesson cadence, formative exit tickets, and differentiated teaching strategies."
                : "Comprehensive curriculum overview integrating student deliverables and educator teaching blueprints."}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
            {onOpenGuidanceModal && (
              <button
                type="button"
                onClick={onOpenGuidanceModal}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "border-[#4A4A3F] bg-[#2D2D2A] text-slate-200 hover:bg-[#383832]" 
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
                }`}
                title="Adjust pacing and guidance parameters"
              >
                <Settings2 size={13} />
                <span>Adjust Guidance</span>
              </button>
            )}

            {onPlaySpeech && (
              <button
                type="button"
                onClick={onPlaySpeech}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                    : isDarkMode 
                    ? "border-[#4A4A3F] bg-[#2D2D2A] text-slate-200 hover:bg-[#383832]" 
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
                }`}
                title="Narrate lesson overview with Text-to-Speech"
              >
                <Volume2 size={13} />
                <span>{isSpeaking ? "Pause Audio" : "Listen"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isDarkMode 
                  ? "border-[#4A4A3F] bg-[#2D2D2A] text-slate-200 hover:bg-[#383832]" 
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              }`}
              title="Copy markdown to clipboard"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isDarkMode 
                  ? "border-[#4A4A3F] bg-[#2D2D2A] text-slate-200 hover:bg-[#383832]" 
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              }`}
              title="Download pure digital markdown (.md)"
            >
              <Download size={13} />
              <span>Export (.md)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700 transition-all cursor-pointer shadow-xs"
              title="Print formatted syllabus document"
            >
              <Printer size={13} />
              <span>Print Syllabus</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric & Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-[#383832] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-sky-500" />
              {perspective === "student" ? "Study Execution Progress:" : "Curriculum Delivery Scope:"}
            </span>
            <span className="text-slate-600 dark:text-[#A1A194]">
              {perspective === "student"
                ? `${completedCount} of ${totalActivityCount} tasks completed (${progressPercent}%)`
                : `${totalUnitsCount} Units Structured · Ready for Instructional Deployment`}
            </span>
          </div>

          <div className="w-full sm:w-56 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${perspective === "student" ? progressPercent : 100}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {perspective === "student" ? `${progressPercent}%` : "100%"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className={`px-6 border-b flex items-center gap-2 overflow-x-auto print:hidden ${
        isDarkMode ? "bg-[#1C1C19] border-[#383832]" : "bg-slate-50 border-slate-200"
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab("units")}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "units"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ListChecks size={15} />
          <span>Interactive Units Roadmap ({totalUnitsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "schedule"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Calendar size={15} />
          <span>Weekly Timetable & Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("document")}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "document"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText size={15} />
          <span>Digital Document (Markdown)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guidance")}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "guidance"
              ? "border-sky-500 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BrainCircuit size={15} />
          <span>Guidance & Focus Strategies</span>
        </button>
      </div>

      {/* 3. TAB CONTENT PANELS */}
      <div className="p-6 sm:p-8">
        {/* TAB 1: INTERACTIVE UNITS ROADMAP */}
        {activeTab === "units" && (
          <div className="space-y-6">
            {plan.units && plan.units.length > 0 ? (
              plan.units.map((unit, uIdx) => {
                const cadence = getTeacherCadence(unit, uIdx);
                const strategies = getTeachingStrategies(unit, uIdx);
                const bloomLevel = getBloomLevel(unit, uIdx);
                const exitTicket = getExitTicket(unit, uIdx);
                const misconceptions = getMisconceptions(unit, uIdx);
                const keyTerms = getKeyTerms(unit, uIdx);

                return (
                  <div
                    key={uIdx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isDarkMode 
                        ? "bg-[#252522] border-[#383832] hover:border-slate-600" 
                        : "bg-white border-slate-200 hover:border-sky-300 shadow-xs"
                    }`}
                  >
                    {/* Unit Header Bar */}
                    <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDarkMode ? "bg-[#2A2A26] border-[#383832]" : "bg-slate-50/80 border-slate-200/70"
                    }`}>
                      <div className="flex items-start gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-sky-600 text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {unit.unitNumber ? String(unit.unitNumber).padStart(2, "0") : String(uIdx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {unit.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-[#A1A194]">
                            <span>{unit.duration}</span>
                            <span aria-hidden="true">·</span>
                            <span>Bloom: {bloomLevel}</span>
                            {unit.difficulty && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="capitalize">{unit.difficulty}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Perspective Status Pill */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {perspective === "student" ? "Self-Study Unit" : perspective === "teacher" ? "Teaching Module" : "Syllabus Module"}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-6">
                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {unit.description}
                      </p>

                      {/* Key Terms Strip (Zero-Pill Compliance: subtle text tokens) */}
                      {keyTerms && keyTerms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-slate-500 dark:text-[#8A8A7A]">Core Concepts:</span>
                          {keyTerms.map((term, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-[#1C1C19] dark:text-slate-200 border border-slate-200 dark:border-[#383832] font-mono text-[11px]"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Learning Objectives */}
                      {unit.objectives && unit.objectives.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C1C19] border border-slate-200/60 dark:border-[#383832]">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-[#A1A194] mb-2.5 flex items-center gap-1.5">
                            <Target size={13} className="text-sky-500" />
                            <span>Target Learning Objectives</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {unit.objectives.map((obj, oIdx) => (
                              <li key={oIdx} className="flex items-start gap-2">
                                <span className="text-sky-500 font-bold shrink-0">•</span>
                                <span className="leading-relaxed">{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* CONDITIONAL PERSPECTIVE RENDERING */}

                      {/* 1. STUDENT VIEW CONTENT */}
                      {(perspective === "student" || perspective === "syllabus") && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-[#383832]">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span>Student Execution Tasks & Milestones</span>
                            </h4>
                            <span className="text-[11px] text-slate-400">Click to check off tasks</span>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {unit.activities && unit.activities.map((act, aIdx) => {
                              const taskId = `u${uIdx}-act${aIdx}`;
                              const isDone = Boolean(completedTasks[taskId]);
                              return (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => toggleTask(taskId)}
                                  className={`p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-3 cursor-pointer ${
                                    isDone
                                      ? isDarkMode
                                        ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300 line-through opacity-75"
                                        : "bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through opacity-80"
                                      : isDarkMode
                                      ? "bg-[#1E1E1C] border-[#383832] hover:bg-[#2A2A26]"
                                      : "bg-white border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {isDone ? (
                                      <CheckCircle2 size={15} className="text-emerald-500" />
                                    ) : (
                                      <Circle size={15} className="text-slate-300 dark:text-slate-600" />
                                    )}
                                  </div>
                                  <span className="flex-1 leading-relaxed">{act}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Self-Assessment Diagnostic Questions */}
                          {unit.selfAssessmentQuestions && unit.selfAssessmentQuestions.length > 0 && (
                            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 mt-3">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                                <HelpCircle size={13} />
                                <span>Active Recall Diagnostic Checkpoints</span>
                              </h4>
                              <div className="space-y-2 text-xs">
                                {unit.selfAssessmentQuestions.map((q, qIdx) => {
                                  const hintId = `hint-${uIdx}-${qIdx}`;
                                  const isHintOpen = Boolean(expandedHints[hintId]);
                                  return (
                                    <div key={qIdx} className="p-2.5 rounded-lg bg-white/70 dark:bg-[#1E1E1C]/80 border border-amber-200/50 dark:border-amber-900/30">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                          <span className="text-amber-600 font-bold mr-1">Q{qIdx + 1}:</span> {q}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => toggleHint(hintId)}
                                          className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                                        >
                                          {isHintOpen ? "Hide Strategy" : "Active Recall Hint"}
                                        </button>
                                      </div>
                                      {isHintOpen && (
                                        <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/30 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                          💡 <strong>Recall Anchor:</strong> Try writing the definition or drawing the schematic diagram from memory on scrap paper before verifying with textbook notes.
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. TEACHER VIEW CONTENT */}
                      {(perspective === "teacher" || perspective === "syllabus") && (
                        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-[#383832]">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                              <School size={14} />
                              <span>Instructional Delivery & Classroom Blueprint</span>
                            </h4>
                            <span className="text-[11px] text-slate-400">Classroom Pacing Cadence</span>
                          </div>

                          {/* 4-Stage Classroom Timing Cadence */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            {cadence.map((step: string, sIdx: number) => {
                              const labels = ["Hook / Starter", "Direct Instruction", "Guided Practice", "Exit Ticket"];
                              const colors = [
                                "border-sky-200 bg-sky-50/60 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200",
                                "border-indigo-200 bg-indigo-50/60 text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200",
                                "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200",
                                "border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
                              ];
                              return (
                                <div key={sIdx} className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${colors[sIdx % colors.length]}`}>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 block mb-1">
                                      Stage {sIdx + 1}: {labels[sIdx % labels.length]}
                                    </span>
                                    <p className="font-medium leading-snug">{step}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Active Pedagogical Strategies & Differentiation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C1C19] border border-slate-200/70 dark:border-[#383832]">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-[#A1A194] mb-2 flex items-center gap-1.5">
                                <Compass size={13} className="text-indigo-500" />
                                <span>Recommended Teaching Strategies</span>
                              </h5>
                              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                {strategies.map((strat: string, stIdx: number) => (
                                  <li key={stIdx} className="flex items-start gap-2">
                                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                                    <span className="leading-relaxed">{strat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-1.5">
                                <AlertTriangle size={13} />
                                <span>Common Student Pitfalls & Misconceptions</span>
                              </h5>
                              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                {misconceptions.map((misc: string, mIdx: number) => (
                                  <li key={mIdx} className="flex items-start gap-2">
                                    <span className="text-rose-500 font-bold shrink-0">!</span>
                                    <span className="leading-relaxed">{misc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Formative Exit Ticket */}
                          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-0.5">
                                Formative Exit Ticket Check
                              </span>
                              <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                                {exitTicket}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl border text-center text-xs text-slate-500">
                Units curriculum data is being compiled. Please switch to the Digital Document tab to view the full text plan.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WEEKLY SCHEDULE & TIMETABLE PLANNER */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-white border-slate-200"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={18} className="text-sky-500" />
                    <span>Academic Timetable & Study Cadence</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A1A194] mt-0.5">
                    Recommended daily distribution for structured syllabus completion
                  </p>
                </div>
                <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                  Target: {plan.recommendedDailyHours || "2 hours/day"}
                </div>
              </div>

              {/* Day-by-Day Schedule Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.studyGuidance?.weeklySchedule && plan.studyGuidance.weeklySchedule.length > 0 ? (
                  plan.studyGuidance.weeklySchedule.map((item, idx) => {
                    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    const dayLabel = days[idx % days.length];
                    const isWeekend = dayLabel === "Saturday" || dayLabel === "Sunday";

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                          isWeekend
                            ? isDarkMode
                              ? "bg-amber-950/10 border-amber-900/30"
                              : "bg-amber-50/40 border-amber-200/60"
                            : isDarkMode
                            ? "bg-[#1C1C19] border-[#383832]"
                            : "bg-slate-50/70 border-slate-200/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold ${isWeekend ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"}`}>
                            {dayLabel} · Day {idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isWeekend ? "Review & Active Recall" : "Direct Learning"}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {item}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  [
                    { day: "Monday", focus: "Unit Theory & Definition Foundations", type: "Core Learning" },
                    { day: "Tuesday", focus: "Algorithmic Derivations & Worked Examples", type: "Deep Dive" },
                    { day: "Wednesday", focus: "Collaborative Case Studies & Lab Exercises", type: "Application" },
                    { day: "Thursday", focus: "Self-Assessment Diagnostic & Problem Solving", type: "Active Recall" },
                    { day: "Friday", focus: "Formative Check & Exit Slip Verification", type: "Assessment" },
                    { day: "Saturday", focus: "Comprehensive Review & Spaced Repetition", type: "Consolidation" },
                    { day: "Sunday", focus: "Self-Care, Mind Mapping & Next Week Preview", type: "Review" }
                  ].map((d, dIdx) => (
                    <div
                      key={dIdx}
                      className={`p-4 rounded-xl border text-xs ${
                        isDarkMode ? "bg-[#1C1C19] border-[#383832]" : "bg-slate-50 border-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sky-500">{d.day}</span>
                        <span className="text-[10px] text-slate-400">{d.type}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{d.focus}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Teacher Weekly Lesson Cadence Guide */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-white border-slate-200"
            }`}>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <School size={16} className="text-indigo-500" />
                <span>Instructor's Classroom Week Structure</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#A1A194] leading-relaxed mb-4">
                Recommended pedagogical rhythm for instructors balancing lectures, lab exercises, and continuous formative assessment.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-900/30">
                  <span className="font-bold text-sky-800 dark:text-sky-300 block mb-1">Session A: Introduce & Hook</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-snug">
                    Ground the unit in a real-world dilemma. Model the foundational mechanism on the board with student participation.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30">
                  <span className="font-bold text-indigo-800 dark:text-indigo-300 block mb-1">Session B: Guided Application</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-snug">
                    Group problem solving, laboratory testing, and comparative analysis of solution trade-offs.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Session C: Synthesize & Assess</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-snug">
                    Administer short exit ticket quizzes, address recorded misconceptions, and assign spaced repetition reading.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIGITAL DOCUMENT (FULL MARKDOWN) */}
        {activeTab === "document" && (
          <div className={`p-6 sm:p-8 rounded-2xl border ${
            isDarkMode ? "bg-[#181816] border-[#383832]" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {plan.fullMarkdownPlan}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* TAB 4: GUIDANCE & COGNITIVE STRATEGIES */}
        {activeTab === "guidance" && (
          <div className="space-y-6">
            {/* Integrated Pomodoro Focus Timer */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-gradient-to-r from-sky-50 to-indigo-50/70 border-sky-100"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Timer size={16} className="text-sky-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      Cognitive Study Tool
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Pomodoro Focus Timer</h3>
                  <p className="text-xs text-slate-600 dark:text-[#A1A194]">
                    {pomodoroMode === "focus" 
                      ? `Focused undistracted study block (${timerPreset} mins)` 
                      : "Brain replenishment break (5-10 mins)"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Preset Selector */}
                  <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-[#181816] border border-slate-200 dark:border-[#383832] text-xs">
                    <button
                      type="button"
                      onClick={() => setPreset(25)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        timerPreset === 25 ? "bg-sky-600 text-white" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      25m
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreset(50)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        timerPreset === 50 ? "bg-sky-600 text-white" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      50m
                    </button>
                  </div>

                  {/* Digital Clock Display */}
                  <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wider px-4 py-1.5 rounded-xl bg-white dark:bg-[#181816] border border-slate-200 dark:border-[#383832] shadow-xs">
                    {formatTimer(timeLeft)}
                  </div>

                  {/* Controls */}
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all cursor-pointer"
                    title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                  >
                    {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimeLeft(pomodoroMode === "focus" ? timerPreset * 60 : 5 * 60);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-[#383832] hover:bg-white dark:hover:bg-[#383832] transition-colors cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

              {completedSessionsCount > 0 && (
                <div className="mt-3 pt-3 border-t border-sky-200/50 dark:border-[#383832] text-xs text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>{completedSessionsCount} focus block{completedSessionsCount > 1 ? "s" : ""} completed today. Keep going!</span>
                </div>
              )}
            </div>

            {/* Dual Pedagogical Frameworks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Cognitive Science Tips */}
              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-white border-slate-200"
              }`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5 flex items-center gap-2">
                  <GraduationCap size={15} /> Student Learning Principles
                </h4>
                <div className="space-y-3 text-xs text-slate-600 dark:text-[#A1A194] leading-relaxed">
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">1. Active Retrieval Practice</strong>
                    Do not reread passively. Close the book, grab a pen, and reconstruct the definitions and equations from pure memory.
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">2. Spaced Repetition Intervals</strong>
                    Review this unit's self-assessment checkpoints on Days 1, 3, 7, 14, and 30 for permanent consolidation.
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">3. The Feynman Technique</strong>
                    Try explaining the unit's core mechanism in plain English to a beginner. Wherever you get stuck reveals your knowledge gaps.
                  </div>
                </div>
              </div>

              {/* Teacher Instructional Architecture */}
              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-white border-slate-200"
              }`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2.5 flex items-center gap-2">
                  <School size={15} /> Teacher Instructional Best Practices
                </h4>
                <div className="space-y-3 text-xs text-slate-600 dark:text-[#A1A194] leading-relaxed">
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">1. Formative Checkpoints (Exit Slips)</strong>
                    Never ask "Does everyone understand?". Instead, collect a 2-minute written exit ticket to objectively measure class comprehension.
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">2. Scaffolded Problem Sets</strong>
                    Model the first example step-by-step ("I do"), guide the second with student prompts ("We do"), and let students solve the third ("You do").
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">3. Differentiated Support</strong>
                    Provide visual flowcharts and formula cheat-sheets for struggling students, and open-ended design trade-offs for advanced learners.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
