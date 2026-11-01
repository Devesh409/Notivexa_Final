import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  BrainCircuit, 
  Flame, 
  GraduationCap, 
  School, 
  Users 
} from "lucide-react";

export interface LessonPlanConfig {
  studyPace: string;
  dailyHours: string;
  studyGoal: string;
  focusArea: string;
  targetAudience?: "student" | "teacher" | "both";
  guidanceNotes?: string;
}

interface LessonPlanGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: LessonPlanConfig) => void;
  documentTitle?: string;
  isDarkMode?: boolean;
  isGenerating?: boolean;
}

export const LessonPlanGuidanceModal: React.FC<LessonPlanGuidanceModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  documentTitle = "Study Material",
  isDarkMode = false,
  isGenerating = false
}) => {
  const [targetAudience, setTargetAudience] = useState<"both" | "student" | "teacher">("both");
  const [studyPace, setStudyPace] = useState<string>("4-week-standard");
  const [dailyHours, setDailyHours] = useState<string>("2 hours/day");
  const [studyGoal, setStudyGoal] = useState<string>("Comprehensive Academic Mastery & Exam Success");
  const [focusArea, setFocusArea] = useState<string>("");
  const [guidanceNotes, setGuidanceNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const audienceNote = targetAudience === "teacher" 
      ? "Target Perspective: Academic Instructor & Classroom Delivery." 
      : targetAudience === "student"
      ? "Target Perspective: Self-Paced Student Study & Exam Retention."
      : "Target Perspective: Dual Student & Teacher Unified Curriculum.";
    
    const combinedNotes = [audienceNote, guidanceNotes.trim()].filter(Boolean).join(" ");

    onGenerate({
      studyPace,
      dailyHours,
      studyGoal,
      focusArea: focusArea.trim(),
      targetAudience,
      guidanceNotes: combinedNotes
    });
  };

  const audiences = [
    {
      id: "student" as const,
      title: "Student Learner Track",
      desc: "Self-study milestones, execution steps, active recall drills, and Pomodoro blocks.",
      icon: GraduationCap,
      color: "from-sky-500 to-blue-600"
    },
    {
      id: "teacher" as const,
      title: "Teacher / Instructor Track",
      desc: "Classroom lesson timing cadence, teaching methods, Bloom's Taxonomy, and exit tickets.",
      icon: School,
      color: "from-indigo-500 to-purple-600"
    },
    {
      id: "both" as const,
      title: "Dual Academic Plan (Recommended)",
      desc: "Complete syllabus architecture serving both classroom teaching and student study.",
      icon: Users,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const paces = [
    {
      id: "1-week-crash",
      title: "1-Week Exam Sprint",
      desc: "High-intensity pacing prioritizing high-yield exam chapters.",
      badge: "Intensive",
      icon: Flame,
      color: "from-amber-500 to-rose-500"
    },
    {
      id: "4-week-standard",
      title: "4-Week Curriculum (Recommended)",
      desc: "Balanced academic pacing with integrated active recall and practice days.",
      badge: "Optimal Pacing",
      icon: Calendar,
      color: "from-sky-500 to-indigo-600"
    },
    {
      id: "8-week-mastery",
      title: "8-12 Week Full Semester",
      desc: "Deep conceptual mastery, thorough problem sets, and periodic mock revisions.",
      badge: "Deep Dive",
      icon: GraduationCap,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const goals = [
    {
      id: "Comprehensive Academic Mastery & Exam Success",
      title: "Exam Success & Score Optimization",
      desc: "Focused on problem solving, previous exam question types, and formula retention."
    },
    {
      id: "Foundational Conceptual Understanding & Theory",
      title: "Deep Conceptual Understanding",
      desc: "Emphasizes core theories, underlying logic, and visual diagram interpretations."
    },
    {
      id: "Fast Catch-up & High-Yield Revision",
      title: "Quick Revision & Knowledge Refresh",
      desc: "Condenses key definitions, formula sheets, and self-assessment checkpoints."
    }
  ];

  const hoursOptions = [
    "1 hour/day (Consistent & Manageable)",
    "2 hours/day (Recommended Standard)",
    "3-4 hours/day (Accelerated Study)",
    "5+ hours/day (Full-Time Immersion)"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-3xl rounded-[28px] shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
          isDarkMode ? "bg-[#1E1E1C] border-[#383832] text-[#F5F5F0]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"
        }`}
      >
        {/* Header */}
        <div className={`p-5 md:p-6 border-b flex items-center justify-between ${
          isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-sans text-lg md:text-xl font-bold">Academic Lesson Plan Setup</h3>
              <p className="text-xs text-[#8A8A7A]">
                Configure personalized curriculum parameters for students and educators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-[#383832] text-[#A1A194]" : "hover:bg-[#E8E8E0] text-[#8A8A7A]"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Pedagogical Guidance Header Card */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-gradient-to-r from-sky-50 to-indigo-50/50 border-sky-100"
          }`}>
            <BrainCircuit size={22} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Pedagogical Design Architecture</h4>
              <p className="text-[#8A8A7A] leading-relaxed">
                Generates a clean <strong>Digital Text Format</strong> lesson plan equipped with student execution tasks, teacher classroom timing breakdowns, formative exit tickets, and interactive weekly timetables.
              </p>
            </div>
          </div>

          {/* 1. Target Audience / Persona Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8A8A7A] flex items-center gap-1.5">
              <Users size={14} /> 1. Choose Target Perspective
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {audiences.map((aud) => {
                const Icon = aud.icon;
                const isSelected = targetAudience === aud.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? "border-sky-500 bg-sky-950/30 ring-2 ring-sky-500/30"
                          : "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/30"
                        : isDarkMode
                        ? "border-[#383832] bg-[#22221F] hover:bg-[#2A2A26]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${aud.color} text-white flex items-center justify-center shadow-xs`}>
                          <Icon size={16} />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                            Active
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs">{aud.title}</h5>
                      <p className="text-[11px] text-[#8A8A7A] mt-1 leading-snug">{aud.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Study Pace Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8A8A7A] flex items-center gap-1.5">
              <Clock size={14} /> 2. Choose Curriculum Pace
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {paces.map((p) => {
                const Icon = p.icon;
                const isSelected = studyPace === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setStudyPace(p.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? "border-sky-500 bg-sky-950/30 ring-2 ring-sky-500/30"
                          : "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/30"
                        : isDarkMode
                        ? "border-[#383832] bg-[#22221F] hover:bg-[#2A2A26]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${p.color} text-white flex items-center justify-center shadow-xs`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {p.badge}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs">{p.title}</h5>
                      <p className="text-[11px] text-[#8A8A7A] mt-1 leading-snug">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Daily Time Commitment */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8A8A7A] flex items-center gap-1.5">
              <Calendar size={14} /> 3. Daily Time Commitment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hoursOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDailyHours(opt)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                    dailyHours === opt
                      ? isDarkMode
                        ? "border-sky-500 bg-sky-950/40 text-sky-300"
                        : "border-sky-500 bg-sky-50 text-sky-800 shadow-xs"
                      : isDarkMode
                      ? "border-[#383832] bg-[#22221F] text-[#A1A194] hover:text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2 size={13} className={`inline mr-2 ${dailyHours === opt ? "text-sky-500" : "opacity-20"}`} />
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Primary Learning Goal */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8A8A7A] flex items-center gap-1.5">
              <Target size={14} /> 4. Primary Objective
            </label>
            <div className="space-y-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setStudyGoal(g.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    studyGoal === g.id
                      ? isDarkMode
                        ? "border-sky-500 bg-sky-950/40"
                        : "border-sky-500 bg-sky-50/70"
                      : isDarkMode
                      ? "border-[#383832] bg-[#22221F] hover:bg-[#2A2A26]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-xs">{g.title}</h5>
                    <p className="text-[11px] text-[#8A8A7A] mt-0.5">{g.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                    studyGoal === g.id ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300"
                  }`}>
                    {studyGoal === g.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Custom Focus Areas or Specific Chapters */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8A8A7A] flex items-center gap-1.5">
              <BookOpen size={14} /> 5. Custom Topics, Chapters or Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Prioritize Unit 2 & 4 derivations, or add laboratory inquiry tasks"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className={`w-full p-3 rounded-xl border text-xs outline-none transition-all ${
                isDarkMode
                  ? "bg-[#181816] border-[#383832] focus:border-sky-500 text-white"
                  : "bg-white border-slate-200 focus:border-sky-500 text-slate-800"
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E8E8E0] dark:border-[#383832] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8A7A] hover:text-[#5A5A40] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isGenerating ? "Compiling Digital Curriculum..." : "Generate Digital Lesson Plan"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
