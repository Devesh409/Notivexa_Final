import { Slide } from "./types";
import { SlidePreviewModal } from "./components/SlidePreviewModal";
import { PPTTopicStudioModal } from "./components/PPTTopicStudioModal";
import { UniversityPaperEditor } from "./components/UniversityPaperEditor";
import { EasyOCRModal, EasyOCRResult } from "./components/EasyOCRModal";
import { DigitalDocumentScannerHub, DigitalScanReport, DocMultiFunctionId } from "./components/DigitalDocumentScannerHub";
import { DigitalLessonPlanViewer, DigitalLessonPlan } from "./components/DigitalLessonPlanViewer";
import { LessonPlanGuidanceModal, LessonPlanConfig } from "./components/LessonPlanGuidanceModal";
import { FlashcardStudio } from "./components/FlashcardStudio";
import { TableUploadHandwritingModal, StructuredTablePayload } from "./components/TableUploadHandwritingModal";
import { UserStorageVaultPanel } from "./components/UserStorageVaultPanel";
import {
  getEffectiveUserStorageKey,
  saveStudyItemToVault,
  listStudyItemsFromVault,
  deleteStudyItemFromVault,
  saveUploadedDocumentToVault,
  getUploadedDocumentFromVault,
  saveWorkspaceSnapshot,
  loadWorkspaceSnapshot,
  getStorageMetrics,
  formatStorageBytes,
  formatStorageGB,
  USER_STORAGE_BASE_USED_BYTES,
  USER_STORAGE_TOTAL_CAPACITY_BYTES,
  type StoredStudyItem,
  type StoredUploadedDocument,
  type StorageCategoryMetrics,
} from "./services/userStorage";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { BookOpen, GraduationCap, Upload, FileText, FileDown, Presentation, FileQuestion, Download, Loader2, Shuffle, LogOut, AlertCircle, X, Camera, Clock, Trash2, RefreshCw, ExternalLink, Calendar, FileVideo, Sun, Moon, CheckCircle2, Workflow, ArrowRight, Sparkles, ChevronDown, Maximize2 , Play, Pause, Square, Volume2 , Check, Target, Activity, ChevronLeft, ChevronRight, Menu, Bell, Settings, Info, House, Mail, HardDrive, Lightbulb, ScanText, Settings2, Database } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import mermaid from "mermaid";
import { auth, db } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, collection, addDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { VideoExplainer, VideoData } from "./components/VideoExplainer";
import { UserProfile } from "./components/UserProfile";
import { AuthForm } from "./components/AuthForm";
import { MfaSettingsModal } from "./components/MfaSettingsModal";
import { Chatbot } from "./components/Chatbot";
import { LibraryPanel, type LibraryBook, type LibraryBookSuggestionAction } from "./components/LibraryPanel";
import { UploadedBookSuggestionsPanel, type UploadedBookSuggestionAction } from "./components/UploadedBookSuggestionsPanel";
import { deleteSavedLibraryBook, getSavedLibraryBookFile, listSavedLibraryBooks, saveLibraryBook, type SavedLibraryBook } from "./components/libraryStorage";
import { pickBookFromGoogleDrive, prepareGoogleDrivePicker } from "./components/googleDrive";

type Mode = "student";


export const cleanBulletText = (text: string): string => {
  if (!text) return "";
  return text
    .trim()
    .replace(/^[\s\*\-\+•▪▫❖➔➢✔✓☑●○◘◙◦✓\-]+/g, "")
    .trim();
};

export const normalizeGeneratedContent = (text: string): string => {
  if (!text) return "";
  const cleaned = text
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1 / $2")
    .replace(/\${1,2}/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^#\s*Date\s*—\s*Handwritten Table Form/gim, "# Project Weekly Progress & Review Logbook — Handwritten Table Form")
    // Ensure Answer / Sample Ideal Answer / Solution always starts on a new line
    .replace(/([^\n])\s*(\*\*(?:Sample Ideal Answer|Ideal Answer|Answer|Detailed Answer|Solution)\s*:?\*\*|\*(?:Sample Answer|Answer)\*\s*:)/gi, "$1\n\n$2")
    // Ensure text immediately following Answer: starts on a new line for clean multi-line readability
    .replace(/(\*\*(?:Sample Ideal Answer|Ideal Answer|Answer|Detailed Answer|Solution)\s*:?\*\*\s*:?)[ \t]+([^\n])/gi, "$1\n\n$2")
    // Ensure standalone key-point lines like "**Handling Missing Values:** ..." or "**Point**: ..." have a markdown bullet marker so they render as proper justified points
    .replace(
      /^(?!\s*[-*+•]|\s*\d+[.)]|\s*\*\*(?:Sample Ideal Answer|Ideal Answer|Answer|Detailed Answer|Solution|Question|Q\d+|Note|Formula|Summary|Conclusion|Introduction|Objective|Unit\s*\d+|Chapter\s*\d+|Module\s*\d+|Part\s*[A-Z0-9]+|Section\s*[A-Z0-9]+)\b)[ \t]*(\*\*[^*\n]{2,60}?(?::\*\*|\*\*\s*:))[ \t]+([^\n]+)$/gim,
      "- $1 $2"
    );

  // Repair any pipe table row where Date + Week/SrNo were concatenated into cell 0 (e.g. "| 03/07/261 |  | ...")
  return cleaned
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|") && !/^\|[\s\-:|]+\|$/.test(trimmed)) {
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        if (cells.length >= 2 && cells[0] && !cells[1]) {
          const m = cells[0].match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(\d{1,3})$/);
          if (m) {
            cells[0] = m[1];
            cells[1] = m[2];
            return `| ${cells.join(" | ")} |`;
          }
        }
      }
      return line;
    })
    .join("\n");
};

const normalizeGeneratedFlashcards = (cards: { term: string; definition: string }[] = []) =>
  cards.map((card) => ({
    ...card,
    term: normalizeGeneratedContent(card.term),
    definition: normalizeGeneratedContent(card.definition),
  }));

export const splitBullet = (bullet: string): { label: string; desc: string } => {
  if (!bullet) return { label: "", desc: "" };
  let label = "";
  let desc = bullet;

  // Look for bold pattern **Label** or **Label:**
  const boldMatch = bullet.match(/^\s*\*\*(.*?)\*\*\s*[:\-]?\s*(.*)/);
  if (boldMatch) {
    label = boldMatch[1].trim();
    desc = boldMatch[2].trim();
  }
 else {
    // Try splitting on first colon, dash, or pipe
    const colonIndex = bullet.indexOf(":");
    const dashIndex = bullet.indexOf(" - ");
    const pipeIndex = bullet.indexOf("|");
    
    // Choose the earliest split index that is valid (reasonable length for a label, e.g. < 40 chars)
    const indices = [
      { idx: colonIndex, char: ":" },
      { idx: dashIndex, char: " - " },
      { idx: pipeIndex, char: "|" }
    ].filter(item => item.idx !== -1 && item.idx < 45);

    if (indices.length > 0) {
      indices.sort((a, b) => a.idx - b.idx);
      const splitItem = indices[0];
      label = bullet.substring(0, splitItem.idx).trim();
      desc = bullet.substring(splitItem.idx + splitItem.char.length).trim();
    }

  }


  // Final cleanup of label and desc
  label = label.replace(/^[\s\*\-\+•▪▫❖➔➢✔✓☑●○◘◙◦✓\-]+/g, "").trim();
  desc = desc.trim();

  return { label, desc: desc || bullet };
};

interface HistoryItem {
  id: string;
  title: string;
  type: "notes" | "assessment" | "flashcards" | "lesson-plan" | "video" | string;
  questionBankType?: string;
  questionBankBloomLevel?: string;
  notesVersion?: number;
  fileUri: string;
  mimeType: string;
  resultText: string;
  slides?: Slide[];
  flashcards: { term: string; definition: string }[];
  videoData?: VideoData | null;
  lessonPlan?: {
    duration: string;
    totalSessions: string;
    sessions: {
      name: string;
      duration: string;
      description: string;
      objectives: string[];
      activities: string[];
    }[];
    fullMarkdownPlan: string;
  }
 | null;
  focusArea: string;
  createdAt: any;
}

function preprocessMermaid(chartCode: string): string {
  if (!chartCode) return "";
  let code = chartCode.replace(/\\n/g, "\n").trim();
  code = code.replace(/^```mermaid\s*/i, "").replace(/```\s*$/, "").trim();

  // If the chart does not start with a valid mermaid declaration, default to graph TD
  if (!/^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|xychart|requirement|C4|mindmap|timeline|block|packet|architecture|kanban|sankey)/i.test(code)) {
    code = `graph TD\n${code}`;
  }

  // Fix cases where quotes are improperly placed after arrows: --> "Label"
  code = code.replace(/(-->|---|==>|-\-\>|->>|-->>|->)\s*"([A-Za-z0-9_\-]+)"(?!\s*[\[\(\{])/g, '$1 $2');

  // Ensure unquoted node brackets with colons, slashes, or parentheses are properly quoted:
  code = code.replace(/([A-Za-z0-9_]+)\[([^"\]\n]+)\]/g, (match, id, text) => {
    if (text.includes(":") || text.includes("(") || text.includes(")") || text.includes("/") || text.includes("&")) {
      const clean = text.replace(/"/g, "'").trim();
      return `${id}["${clean}"]`;
    }
    return match;
  });

  return code;
}

interface ParsedDiagramItem {
  id: string;
  label: string;
  isDecision?: boolean;
}

interface ParsedDiagramLink {
  from: string;
  to: string;
  label?: string;
}

interface ParsedDiagramSubgraph {
  title: string;
  nodes: ParsedDiagramItem[];
}

function parseMermaidFallback(rawCode: string) {
  const lines = rawCode.split("\n").map(l => l.trim()).filter(Boolean);
  const subgraphs: ParsedDiagramSubgraph[] = [];
  const connections: ParsedDiagramLink[] = [];
  const standaloneNodes: ParsedDiagramItem[] = [];
  const nodeMap = new Map<string, ParsedDiagramItem>();

  let currentSubgraph: ParsedDiagramSubgraph | null = null;

  for (const line of lines) {
    if (/^subgraph\s+/i.test(line)) {
      const match = line.match(/^subgraph\s+(?:[A-Za-z0-9_]+\s*)?\[?"?([^"\]]+)"?\]?/i);
      const title = match ? match[1].trim() : "System Architecture Tier";
      currentSubgraph = { title, nodes: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }
    if (/^end\b/i.test(line)) {
      currentSubgraph = null;
      continue;
    }

    // Match node definitions or relations
    // e.g. A["Label"] -->|"protocol"| B["Label"]
    const relationMatch = line.match(/([A-Za-z0-9_]+)(?:\["([^"]+)"\]|\("([^"]+)"\)|\{"([^"]+)"\})?\s*(-->|---|==>|->)\s*(?:\|"([^"]+)"\|\s*)?([A-Za-z0-9_]+)(?:\["([^"]+)"\]|\("([^"]+)"\)|\{"([^"]+)"\})?/);
    if (relationMatch) {
      const fromId = relationMatch[1];
      const fromLabel = relationMatch[2] || relationMatch[3] || relationMatch[4] || fromId;
      const isFromDecision = Boolean(relationMatch[4]);
      const linkLabel = relationMatch[6] ? relationMatch[6].trim() : undefined;
      const toId = relationMatch[7];
      const toLabel = relationMatch[8] || relationMatch[9] || relationMatch[10] || toId;
      const isToDecision = Boolean(relationMatch[10]);

      if (!nodeMap.has(fromId)) {
        const item = { id: fromId, label: fromLabel, isDecision: isFromDecision };
        nodeMap.set(fromId, item);
        if (currentSubgraph) currentSubgraph.nodes.push(item);
        else standaloneNodes.push(item);
      }
      if (!nodeMap.has(toId)) {
        const item = { id: toId, label: toLabel, isDecision: isToDecision };
        nodeMap.set(toId, item);
        if (currentSubgraph) currentSubgraph.nodes.push(item);
        else standaloneNodes.push(item);
      }
      connections.push({ from: fromId, to: toId, label: linkLabel });
      continue;
    }

    // Standalone node: A["Label"] or A{"Decision"}
    const nodeMatch = line.match(/^([A-Za-z0-9_]+)(?:\["([^"]+)"\]|\("([^"]+)"\)|\{"([^"]+)"\})/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = nodeMatch[2] || nodeMatch[3] || nodeMatch[4] || id;
      const isDecision = Boolean(nodeMatch[4]);
      if (!nodeMap.has(id)) {
        const item = { id, label, isDecision };
        nodeMap.set(id, item);
        if (currentSubgraph) currentSubgraph.nodes.push(item);
        else standaloneNodes.push(item);
      }
    }
  }

  return { subgraphs, standaloneNodes, connections, allNodes: Array.from(nodeMap.values()) };
}

function MermaidChart({ chart, handwritingFont, mode, penColor, isDarkMode }: { chart: string; handwritingFont?: string; mode?: string; penColor?: string; isDarkMode?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const preprocessedChart = useMemo(() => preprocessMermaid(chart), [chart]);

  useEffect(() => {
    setHasError(false);

    const font = (mode === 'student') ? (
      handwritingFont === 'font-handwriting' ? 'Caveat, cursive' :
      handwritingFont === 'font-handwriting-indie' ? '"Indie Flower", cursive' :
      handwritingFont === 'font-handwriting-kalam' ? 'Kalam, cursive' :
      handwritingFont === 'font-handwriting-shadows' ? '"Shadows Into Light", cursive' :
      handwritingFont === 'font-handwriting-patrick' ? '"Patrick Hand", cursive' :
      'Caveat, cursive') : 'Inter, sans-serif';

    const isDark = isDarkMode || (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
    const mainColor = isDark 
      ? (penColor === 'blue' ? '#93c5fd' : '#f3f4f6')
      : (penColor === 'blue' ? '#1d4ed8' : '#111827');
    const strokeColor = isDark
      ? (penColor === 'blue' ? '#60a5fa' : '#9ca3af')
      : (penColor === 'blue' ? '#2563eb' : '#374151');
    const bkgColor = isDark ? '#22221f' : '#fffdf7';

    try {
      mermaid.initialize({
        htmlLabels: false,
        startOnLoad: false,
        suppressErrorRendering: true,
        theme: "base",
        // @ts-ignore
        look: mode === 'student' ? 'handDrawn' : 'classic',
        handDrawnSeed: 42,
        fontFamily: font,
        themeVariables: {
          fontFamily: font,
          fontSize: mode === 'student' ? '18px' : '14px',
          primaryColor: isDark ? '#2a2a26' : '#fffbeb',
          primaryBorderColor: strokeColor,
          primaryTextColor: mainColor,
          lineColor: strokeColor,
          nodeBorder: strokeColor,
          mainBkg: bkgColor,
          labelTextColor: mainColor,
          actorLineColor: strokeColor,
          actorBkg: bkgColor,
          actorTextColor: mainColor,
          signalColor: strokeColor,
          signalTextColor: mainColor,
          edgeLabelBackground: bkgColor,
        },
        flowchart: {
          htmlLabels: false,
          curve: 'basis'
        },
        sequence: {
          showSequenceNumbers: false,
          actorFontFamily: font,
          noteFontFamily: font,
          messageFontFamily: font
        }
      });
    } catch (initErr) {
      console.warn("Mermaid initialize warning:", initErr);
    }

    if (ref.current && preprocessedChart) {
      const renderId = `mermaid-${Math.random().toString(36).substring(7)}`;

      mermaid.render(renderId, preprocessedChart).then(({ svg }) => {
        if (svg.includes("Syntax error")) throw new Error("Mermaid syntax error SVG");
        if (ref.current) {
          ref.current.innerHTML = svg;
          setHasError(false);
        }
      }).catch(err => {
        console.warn("First Mermaid render failed, trying level-1 fallback...", err);
        const fallbackChart = preprocessedChart
          .replace(/\["([^"\n]*)"\]/g, (_, inner) => `["${inner.replace(/[^A-Za-z0-9_\-\s:\.,\(\)'\/\+]/g, " ")}"]`)
          .replace(/\("([^"\n]*)"\)/g, (_, inner) => `("${inner.replace(/[^A-Za-z0-9_\-\s:\.,\(\)'\/\+]/g, " ")}")`)
          .replace(/<br\s*\/?>/gi, " ");

        const fallbackId = `mermaid-${Math.random().toString(36).substring(7)}`;
        mermaid.render(fallbackId, fallbackChart).then(({ svg }) => {
          if (svg.includes("Syntax error")) throw new Error("Mermaid syntax error SVG");
          if (ref.current) {
            ref.current.innerHTML = svg;
            setHasError(false);
          }
        }).catch(fallbackErr => {
          console.warn("Mermaid level-1 fallback failed, activating visual schematic fallback parser:", fallbackErr);
          setHasError(true);
        });
      });
    }
  }, [preprocessedChart, handwritingFont, mode, penColor, isDarkMode]);

  const parsed = useMemo(() => {
    if (!hasError) return null;
    return parseMermaidFallback(chart);
  }, [hasError, chart]);

  const isStudent = mode === 'student';
  const headingColor = penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]';
  const textColor = penColor === 'blue' ? 'text-[#1d4ed8]' : 'text-[#1e293b]';
  const borderColor = penColor === 'blue' ? 'border-[#1d4ed8]/40' : 'border-[#1e293b]/40';
  const linkBadgeColor = penColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-800 border-slate-300';

  if (hasError && parsed && (parsed.subgraphs.length > 0 || parsed.allNodes.length > 0)) {
    return (
      <div className={`my-6 border-2 border-dashed ${borderColor} rounded-2xl p-5 md:p-6 transition-all not-prose ${
        isStudent ? `bg-[#FAF8F3] ${handwritingFont} shadow-[0_2px_12px_rgba(0,0,0,0.03)]` : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between border-b border-dashed border-slate-300/80 pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">✏️</span>
            <div>
              <h4 className={`text-xl font-bold tracking-wide leading-tight ${headingColor}`}>
                Hand-Drawn System Blueprint & Architecture
              </h4>
              <p className={`text-xs opacity-80 ${textColor}`}>
                Synthesized visual schematic from uploaded document
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${linkBadgeColor}`}>
            Visual Schematic
          </span>
        </div>

        {/* Render Subgraphs or Tiers */}
        <div className="space-y-4">
          {parsed.subgraphs.map((sub, sIdx) => (
            <div key={`sub-${sIdx}`} className="border border-slate-300/80 rounded-xl p-3.5 bg-white/70 shadow-2xs">
              <h5 className={`text-base font-bold mb-2 pb-1 border-b border-dashed border-slate-200 ${headingColor}`}>
                {sub.title}
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {sub.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`p-3 rounded-lg border text-sm leading-snug flex items-center gap-2 ${
                      node.isDecision
                        ? "bg-amber-50/80 border-amber-300 text-amber-950 font-semibold"
                        : "bg-white border-slate-300/80 text-slate-800"
                    }`}
                  >
                    <span className="font-bold text-xs opacity-75 shrink-0 select-none">
                      {node.isDecision ? "◆" : "■"}
                    </span>
                    <span>{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Standalone Nodes */}
          {parsed.standaloneNodes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {parsed.standaloneNodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border text-sm leading-snug flex items-center gap-2 ${
                    node.isDecision
                      ? "bg-amber-50/80 border-amber-300 text-amber-950 font-semibold"
                      : "bg-white border-slate-300/80 text-slate-800"
                  }`}
                >
                  <span className="font-bold text-xs opacity-75 shrink-0 select-none">
                    {node.isDecision ? "◆" : "■"}
                  </span>
                  <span>{node.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Connections list */}
          {parsed.connections.length > 0 && (
            <div className="pt-2 border-t border-dashed border-slate-300/70">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 select-none">
                Connection Interactions & Protocol Flows:
              </div>
              <div className="flex flex-wrap gap-2">
                {parsed.connections.map((c, cIdx) => (
                  <span
                    key={`conn-${cIdx}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${linkBadgeColor}`}
                  >
                    <strong className="font-bold">{c.from}</strong>
                    <span className="text-slate-400">➔</span>
                    <strong className="font-bold">{c.to}</strong>
                    {c.label && <span className="opacity-90 italic">({c.label})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`mt-3 pt-2 text-xs italic opacity-85 border-t border-slate-200/80 ${textColor}`}>
          💡 <strong>Student Note:</strong> Carefully examine each component tier, protocol link, and decision pathway shown above for comprehensive examination credit.
        </div>
      </div>
    );
  }

  return (
    <div className={`my-6 rounded-2xl transition-all not-prose ${
      isStudent
        ? `bg-[#FAF8F3] border-2 border-dashed ${borderColor} p-4 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${handwritingFont}`
        : "bg-white border border-slate-200/90 p-4 shadow-sm"
    }`}>
      {isStudent && (
        <div className="flex items-center justify-between border-b border-dashed border-slate-300/80 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">✏️</span>
            <div>
              <h4 className={`text-xl font-bold tracking-wide leading-tight ${headingColor}`}>
                Hand-Drawn System Schematic & Flowchart
              </h4>
              <p className={`text-xs opacity-80 ${textColor}`}>
                Textbook-accurate visual blueprint drawn in student notebook style
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${linkBadgeColor}`}>
            Hand-Drawn Model
          </span>
        </div>
      )}

      <div
        ref={ref}
        className="w-full flex justify-center items-center overflow-x-auto py-2"
        style={{ minHeight: "120px" }}
      />

      {isStudent && (
        <div className={`mt-3 pt-2 text-xs italic opacity-85 border-t border-dashed border-slate-300/80 flex items-center justify-between ${textColor}`}>
          <span>
            💡 <strong>Student Revision Note:</strong> Trace each interface, protocol link, and state transition shown in this schematic for full-credit examination answers.
          </span>
          <span className="font-mono text-[10px] opacity-75">Mermaid Hand-Drawn</span>
        </div>
      )}
    </div>
  );
}

export function oklabToRgb(oklabStr: string): string {
  const match = oklabStr.match(/oklab\(\s*([+-]?[\d\.]+%?)\s+([+-]?[\d\.]+%?)\s+([+-]?[\d\.]+%?)(?:\s*(?:\/|\s)\s*([+-]?[\d\.]+%?))?\s*\)/i);
  if (!match) return "rgb(15, 23, 42)";

  let L = parseFloat(match[1]);
  if (match[1].endsWith('%')) L /= 100;

  let labA = parseFloat(match[2]);
  if (match[2].endsWith('%')) labA = (labA / 100) * 0.4;

  let labB = parseFloat(match[3]);
  if (match[3].endsWith('%')) labB = (labB / 100) * 0.4;

  let alpha = 1;
  if (match[4]) {
    alpha = parseFloat(match[4]);
    if (match[4].endsWith('%')) alpha /= 100;
  }

  const l_ = L + 0.3963377774 * labA + 0.2158037573 * labB;
  const m_ = L - 0.1055613458 * labA - 0.0638541728 * labB;
  const s_ = L - 0.0894841775 * labA - 1.2914855480 * labB;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toSrgb = (val: number) => {
    if (isNaN(val)) return 0;
    if (val <= 0.0031308) return Math.max(0, Math.min(255, Math.round(12.92 * Math.max(0, val) * 255)));
    return Math.max(0, Math.min(255, Math.round((1.055 * Math.pow(Math.max(0, val), 1 / 2.4) - 0.055) * 255)));
  };

  const r = toSrgb(rLinear);
  const g = toSrgb(gLinear);
  const b = toSrgb(bLinear);

  return (alpha !== undefined && alpha < 1) ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

export function oklchToRgb(oklchStr: string): string {
  const match = oklchStr.match(/oklch\(\s*([+-]?[\d\.]+%?)\s+([+-]?[\d\.]+%?)\s+([+-]?[\d\.]+(?:deg|rad|turn)?)(?:\s*(?:\/|\s)\s*([+-]?[\d\.]+%?))?\s*\)/i);
  if (!match) return "rgb(30, 41, 59)";

  let l = parseFloat(match[1]);
  if (match[1].endsWith('%')) l /= 100;

  let c = parseFloat(match[2]);
  if (match[2].endsWith('%')) c = (c / 100) * 0.4;

  const hRaw = match[3];
  let h = parseFloat(hRaw);
  if (hRaw.endsWith('turn')) h = h * 360;
  else if (hRaw.endsWith('rad')) h = (h * 180) / Math.PI;

  let alpha = 1;
  if (match[4]) {
    alpha = parseFloat(match[4]);
    if (match[4].endsWith('%')) alpha /= 100;
  }

  const hRad = (h * Math.PI) / 180;
  const labA = c * Math.cos(hRad);
  const labB = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * labA + 0.2158037573 * labB;
  const m_ = l - 0.1055613458 * labA - 0.0638541728 * labB;
  const s_ = l - 0.0894841775 * labA - 1.2914855480 * labB;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toSrgb = (val: number) => {
    if (isNaN(val)) return 0;
    if (val <= 0.0031308) return Math.max(0, Math.min(255, Math.round(12.92 * Math.max(0, val) * 255)));
    return Math.max(0, Math.min(255, Math.round((1.055 * Math.pow(Math.max(0, val), 1 / 2.4) - 0.055) * 255)));
  };

  const r = toSrgb(rLinear);
  const g = toSrgb(gLinear);
  const b = toSrgb(bLinear);

  return (alpha !== undefined && alpha < 1) ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

export function sanitizeCssColors(val: string): string {
  if (typeof val !== 'string') return val;
  if (!val.includes('oklch') && !val.includes('oklab') && !val.includes('color(') && !val.includes('hwb(') && !val.includes('lab(') && !val.includes('lch(')) {
    return val;
  }

  let result = val;
  // Replace oklch(...)
  result = result.replace(/oklch\(\s*[+-]?[\d\.]+%?\s+[+-]?[\d\.]+%?\s+[+-]?[\d\.]+(?:deg|rad|turn)?(?:\s*(?:\/|\s)\s*[+-]?[\d\.]+%?)?\s*\)/gi, (m) => oklchToRgb(m));

  // Replace oklab(...)
  result = result.replace(/oklab\(\s*[+-]?[\d\.]+%?\s+[+-]?[\d\.]+%?\s+[+-]?[\d\.]+%?(?:\s*(?:\/|\s)\s*[+-]?[\d\.]+%?)?\s*\)/gi, (m) => oklabToRgb(m));

  // Replace color(...) or hwb(...) or lab(...) or lch(...)
  result = result.replace(/color\([^\)]+\)/gi, 'rgb(30, 41, 59)');
  result = result.replace(/hwb\([^\)]+\)/gi, 'rgb(30, 41, 59)');
  result = result.replace(/lab\([^\)]+\)/gi, 'rgb(30, 41, 59)');
  result = result.replace(/lch\([^\)]+\)/gi, 'rgb(30, 41, 59)');

  // Hard safety fallback for any unusual oklab/oklch strings:
  if (result.includes('oklab(') || result.includes('oklch(')) {
    result = result.replace(/oklab\([^\)]*\)/gi, 'rgb(30, 41, 59)').replace(/oklch\([^\)]*\)/gi, 'rgb(30, 41, 59)');
  }

  return result;
}

export function createColorSafeStyleProxy(style: CSSStyleDeclaration): CSSStyleDeclaration {
  return new Proxy(style, {
    get(target, prop) {
      if (prop === 'getPropertyValue') {
        return function (propertyName: string) {
          const val = target.getPropertyValue(propertyName);
          return typeof val === 'string' ? sanitizeCssColors(val) : val;
        };
      }
      if (prop === 'item') {
        return function (index: number) {
          return target.item(index);
        };
      }
      const val = (target as any)[prop];
      if (typeof val === 'string') {
        return sanitizeCssColors(val);
      }
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  });
}


export default function App() {
  console.log("App component render started!");
  const [user, setUser] = useState<User | null>(null);
  const [isQuickGuest, setIsQuickGuest] = useState<boolean>(
    () => typeof window === "undefined" || sessionStorage.getItem("notivexa_require_signin") !== "true"
  );
  const [selectedAiModel, setSelectedAiModel] = useState<"gemini-3.1-flash-lite" | "gemini-3.8-flash" | "gemini-flash-latest" | "groq-qwen-27b" | "claude-3-5-sonnet">("gemini-3.1-flash-lite");
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("student");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{fileUri: string, mimeType: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [drivePickerReady, setDrivePickerReady] = useState(false);
  const [drivePickerFailed, setDrivePickerFailed] = useState(false);
  const [isPickingDrive, setIsPickingDrive] = useState(false);
  const [generatingType, setGeneratingType] = useState<string>("");
  const [resultText, setResultText] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeNav, setActiveNav] = useState<"materials" | "library" | "tools" | "learning" | "storage">("materials");
  const [storageRefreshTick, setStorageRefreshTick] = useState<number>(0);
  const userStorageKey = getEffectiveUserStorageKey(user?.uid, user?.email);
  const [vaultMetrics, setVaultMetrics] = useState<StorageCategoryMetrics>({
    totalItems: 0,
    totalBytes: 0,
    usedStorageBytes: USER_STORAGE_BASE_USED_BYTES,
    totalCapacityBytes: USER_STORAGE_TOTAL_CAPACITY_BYTES,
    availableStorageBytes: USER_STORAGE_TOTAL_CAPACITY_BYTES - USER_STORAGE_BASE_USED_BYTES,
    usagePercentage: 0,
    uploadedFilesCount: 0,
    notesCount: 0,
    questionsAndExamsCount: 0,
    flashcardSetsCount: 0,
    pptDecksCount: 0,
    videoLecturesCount: 0,
    lessonPlansCount: 0,
    libraryBooksCount: 0,
    lastSavedAtMs: null,
  });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [uiZoomMode, setUiZoomMode] = useState<"auto" | "0.65" | "0.75" | "0.85" | "0.92" | "1">("auto");
  const viewportWrapperRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width:
      typeof window !== "undefined"
        ? document.documentElement?.clientWidth || window.innerWidth
        : 1280,
    height:
      typeof window !== "undefined"
        ? window.visualViewport?.height || window.innerHeight || document.documentElement?.clientHeight
        : 800,
  }));
  const windowWidth = viewportSize.width;
  const windowHeight = viewportSize.height;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const el = viewportWrapperRef.current;
      const width =
        el?.clientWidth ||
        document.documentElement?.clientWidth ||
        window.innerWidth;
      const height =
        el?.clientHeight ||
        window.visualViewport?.height ||
        window.innerHeight ||
        document.documentElement?.clientHeight;
      setViewportSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && viewportWrapperRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(viewportWrapperRef.current);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      observer?.disconnect();
    };
  }, [authLoading, user, isQuickGuest]);

  const effectiveUiZoom =
    uiZoomMode === "auto"
      ? windowWidth < 520
        ? 0.68
        : windowWidth < 768
          ? 0.76
          : windowWidth < 1080
            ? 0.85
            : windowWidth < 1320
              ? 0.92
              : 1
      : parseFloat(uiZoomMode);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "storage">("general");
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPPTStudioModal, setShowPPTStudioModal] = useState(false);
  const [selectedPPTTopic, setSelectedPPTTopic] = useState("");
  const [pptTheme, setPptTheme] = useState<"academic" | "professional" | "minimalist" | "pastel">("academic");
  const [resultType, setResultType] = useState<string>("");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [flashcards, setFlashcards] = useState<{term: string, definition: string}[]>([]);
  const [lessonPlan, setLessonPlan] = useState<DigitalLessonPlan | null>(null);
  const [showLessonPlanGuidanceModal, setShowLessonPlanGuidanceModal] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [handwritingFont, setHandwritingFont] = useState("font-handwriting");
  const [flashcardThemeStyle, setFlashcardThemeStyle] = useState<"default" | "monochrome" | "pastel" | "high-contrast">("pastel");
  const [pageStyle, setPageStyle] = useState("ruled");
  const [penColor, setPenColor] = useState("blue");
  const [summaryViewMode, setSummaryViewMode] = useState<"continuous" | "single">("continuous");
  const setGeneratedResultText = (text: string) => setResultText(normalizeGeneratedContent(text));
  const setGeneratedFlashcards = (cards: { term: string; definition: string }[] = []) => {
    setFlashcards(normalizeGeneratedFlashcards(cards));
  };
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [focusArea, setFocusArea] = useState("Algorithms, step-by-step processes, and diagrams in student style");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [questionBankType, setQuestionBankType] = useState("all");
  const [activeExamTool, setActiveExamTool] = useState<"question-bank" | "exam-paper">("question-bank");
  const [examPaperType, setExamPaperType] = useState("paper-full");
  const [universityMarks, setUniversityMarks] = useState<number>(60);
  const [questionBankBloomLevel, setQuestionBankBloomLevel] = useState("all");
  // Dedicated Handwriting Notes (Chapter & Unit Wise) State
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [customUnitTitle, setCustomUnitTitle] = useState<string>("");
  const [customChapterTitle, setCustomChapterTitle] = useState<string>("");
  const [noteDepthTarget, setNoteDepthTarget] = useState<number>(52);
  const [chapterScopeStyle, setChapterScopeStyle] = useState<string>("comprehensive");
  const [detectedUnits, setDetectedUnits] = useState<{ unit: string; title: string; chapters: { chapter: string; title: string }[] }[]>([]);
  const [isDetectingChapters, setIsDetectingChapters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const isGoogleSigningInRef = useRef<boolean>(false);
  const isDriveAuthRef = useRef<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [historyDeleteError, setHistoryDeleteError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => typeof window !== "undefined" && localStorage.getItem("eduSmart_darkMode") === "true");
  const [inputType, setInputType] = useState<"upload" | "scan">("upload");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // EasyOCR Framework & Digital Document Scanner State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<EasyOCRResult | null>(null);
  const [ocrPreviewImage, setOcrPreviewImage] = useState<string | null>(null);
  const [digitalScanReport, setDigitalScanReport] = useState<DigitalScanReport | null>(null);
  const [scannedDigitalText, setScannedDigitalText] = useState<string>("");
  const [isScanningDigitalDoc, setIsScanningDigitalDoc] = useState<boolean>(false);
  const [showDigitalScannerHub, setShowDigitalScannerHub] = useState<boolean>(true);
  const [activeScanFocusTopic, setActiveScanFocusTopic] = useState<string>("");
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [batchProgressLabel, setBatchProgressLabel] = useState<string>("");
  const [activeMultiFunctionTitle, setActiveMultiFunctionTitle] = useState<string>("");
  const [isDraggingUpload, setIsDraggingUpload] = useState<boolean>(false);
  const [showCreateDigitalDocModal, setShowCreateDigitalDocModal] = useState<boolean>(false);
  const [showTableUploadModal, setShowTableUploadModal] = useState<boolean>(false);
  const [isVerbatimTableMode, setIsVerbatimTableMode] = useState<boolean>(false);
  const [customDigitalDocTitle, setCustomDigitalDocTitle] = useState<string>("");
  const [customDigitalDocFormat, setCustomDigitalDocFormat] = useState<".md" | ".txt" | ".csv" | ".json">(".md");
  const [customDigitalDocContent, setCustomDigitalDocContent] = useState<string>("");
  const [generatedFunctionsCache, setGeneratedFunctionsCache] = useState<
    Record<
      string,
      {
        label: string;
        resultText?: string;
        resultType?: string;
        flashcards?: { term: string; definition: string }[];
        lessonPlan?: DigitalLessonPlan | null;
        slides?: Slide[];
        videoData?: VideoData | null;
      }
    >
  >({});
  const notesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [personalLibraryBooks, setPersonalLibraryBooks] = useState<SavedLibraryBook[]>([]);
  const [busyLibraryBookId, setBusyLibraryBookId] = useState<string | null>(null);
  const notesViewerRef = useRef<HTMLDivElement>(null);
  const extractedTextCacheRef = useRef<Map<string, string>>(new Map());
  const hasRestoredWorkspaceRef = useRef<boolean>(false);

  const defaultLibraryBooks = [
    { id: "book:gatsby", title: "The Great Gatsby", author: "F. Scott Fitzgerald", desc: "A detailed exploration of wealth, love, obsession, and the American Dream.", department: "Arts" },
    { id: "book:frankenstein", title: "Frankenstein", author: "Mary Shelley", desc: "A legendary sci-fi tale examining creation, scientific ambition, and isolation.", department: "Science" },
    { id: "book:sherlock_holmes", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", desc: "Classic detective mysteries showcasing brilliant deduction and case analysis.", department: "Arts" },
    { id: "book:alice_in_wonderland", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", desc: "A whimsical journey through nonsense, dreams, and linguistic puzzles.", department: "Arts" },
    { id: "book:pride_and_prejudice", title: "Pride & Prejudice", author: "Jane Austen", desc: "A brilliant romantic comedy about social status, pride, and assumptions.", department: "Arts" },
    { id: "book:macbeth", title: "Macbeth", author: "William Shakespeare", desc: "A masterpiece tragedy examining raw political ambition, guilt, and fate.", department: "Arts" },
    { id: "book:distributed_systems", title: "Distributed Systems: Concepts and Design", author: "George Coulouris", desc: "Comprehensive coverage of distributed system architectures, peer-to-peer systems, middleware, consensus, and cloud algorithms.", department: "MCA" },
    { id: "book:advanced_db", title: "Advanced Database Management Systems", author: "Raghu Ramakrishnan", desc: "Deep dive into query optimization, transaction management, indexing, and NoSQL/distributed database technologies.", department: "MCA" },
    { id: "book:cpp_oop", title: "Programming in C++ and Object-Oriented Design", author: "Bjarne Stroustrup", desc: "Foundational principles of object-oriented programming, classes, inheritance, polymorphism, memory management, and C++ design.", department: "BCA" },
    { id: "book:computer_networks", title: "Computer Networks & Internet Protocols", author: "Andrew S. Tanenbaum", desc: "Detailed exploration of network layers, routing protocols, TCP/UDP, and application-layer services.", department: "BCA" },
    { id: "book:artificial_intelligence", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell & Peter Norvig", desc: "The definitive guide to rational agents, search, logic, machine learning, neural networks, and agent architectures.", department: "Engineering" },
    { id: "book:engineering_math", title: "Advanced Engineering Mathematics", author: "Erwin Kreyszig", desc: "Fourier analysis, partial differential equations, complex analysis, linear algebra, and numerical engineering methods.", department: "Engineering" },
    { id: "book:fluid_mechanics", title: "Fluid Mechanics & Thermodynamics", author: "Frank M. White", desc: "Fundamental principles of fluid properties, fluid statics, control volume analysis, pipe flow, drag, and lift.", department: "Engineering" },
    { id: "book:medical_pharmacology", title: "Essentials of Medical Pharmacology", author: "K.D. Tripathi", desc: "Comprehensive drug actions, mechanisms, pharmacokinetics (ADME), clinical therapeutics, and toxicities.", department: "Pharmacy" },
    { id: "book:pharmaceutics", title: "Pharmaceutics: Formulations and Drug Delivery", author: "Michael E. Aulton", desc: "Dosage form design, biopharmaceutics, drug stability, physical pharmacy, and industrial manufacturing.", department: "Pharmacy" },
    { id: "book:corporate_finance", title: "Principles of Corporate Finance", author: "Richard A. Brealey & C. Myers", desc: "Valuation models, capital budgeting, risk management, capital structure, and financial decision-making.", department: "Commerce" },
    { id: "book:financial_accounting", title: "Advanced Financial Accounting", author: "Theodore E. Christensen", desc: "Consolidations, foreign currency transactions, partnerships, segment reporting, and reporting standards.", department: "Commerce" },
    { id: "book:brief_history_time", title: "A Brief History of Time & Cosmology", author: "Stephen Hawking", desc: "A journey through space-time, black holes, the big bang, quantum mechanics, and the search for a unified physical theory.", department: "Science" },
    { id: "book:organic_chemistry", title: "Organic Chemistry: Structure and Reactivity", author: "Robert T. Morrison & Robert N. Boyd", desc: "Detailed chemical structures, reaction mechanisms (substitution, elimination), synthesis pathways, and spectroscopy.", department: "Science" },
    { id: "book:story_of_art", title: "The Story of Art & Visual History", author: "E.H. Gombrich", desc: "The classic survey of art history, from prehistoric cave paintings and classical eras to Renaissance, Modern, and contemporary arts.", department: "Arts" },
    { id: "book:history_western_philosophy", title: "A History of Western Philosophy", author: "Bertrand Russell", desc: "A comprehensive analysis of philosophical thought from the pre-Socratics to 20th-century analytical philosophy.", department: "Arts" }
  ];
  const allLibraryBooks: LibraryBook[] = [...defaultLibraryBooks, ...personalLibraryBooks];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("eduSmart_darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("eduSmart_darkMode", "false");
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isMounted = true;
    void prepareGoogleDrivePicker()
      .then(() => {
        if (isMounted) setDrivePickerReady(true);
      })
      .catch((pickerError) => {
        console.warn("Could not prepare the Google Drive picker:", pickerError);
        if (isMounted) setDrivePickerFailed(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        setAuthLoading(false);
      }
    }, 2000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (authenticatedUser) => {
        resolved = true;
        clearTimeout(fallbackTimer);
        setUser(authenticatedUser);
        setAuthLoading(false);
      },
      (authErr) => {
        console.warn("Auth initialization warning:", authErr);
        resolved = true;
        clearTimeout(fallbackTimer);
        setAuthLoading(false);
      }
    );
    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    void listSavedLibraryBooks()
      .then((books) => {
        if (isMounted) setPersonalLibraryBooks(books);
      })
      .catch((storageError) => {
        console.warn("Could not load the local book library:", storageError);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    void getStorageMetrics(userStorageKey)
      .then((m) => {
        if (isMounted) setVaultMetrics(m);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [userStorageKey, storageRefreshTick, history.length, personalLibraryBooks.length]);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [resultText]);

  useEffect(() => {
    if (summaryViewMode === "single") {
      notesViewerRef.current?.scrollTo({ top: 0, left: 0 });
    }
  }, [currentPageIndex, summaryViewMode]);

  const displayedResultText = normalizeGeneratedContent(resultText);

  const pagesToRender = useMemo(() => {
    const rawPages = displayedResultText
      .split("---SET_SEPARATOR---")
      .flatMap((setMarkdown) => setMarkdown.split(/[\s\-_*"'`]*PAGE_BREAK[\s\-_*"'`]*/i))
      .map((p) => p.trim())
      .filter((pageMarkdown) => pageMarkdown.length > 0);

    if (rawPages.length === 0) {
      return displayedResultText.trim().length > 0 ? [displayedResultText] : [];
    }

    if (
      resultType !== "notes" &&
      resultType !== "verbatim-handwriting" &&
      resultType !== "question-bank" &&
      !["executive-summary", "formula-sheet", "glossary", "viva-qa", "mindmap-atlas", "cheat-sheet"].includes(resultType) &&
      !(resultType === "exam-paper" && examPaperType !== "paper-university")
    ) {
      return rawPages;
    }

    // For "verbatim-handwriting" (Same-to-Same Exact Document), NEVER strip any Table of Contents, Index, or original document text
    const cleanedPages =
      resultType === "verbatim-handwriting"
        ? rawPages.filter((p) => p.length > 0)
        : rawPages
            .map((p) =>
              p
                .replace(
                  /(?:^|\n)#{1,3}\s*(?:table\s+of\s+contents|index|contents)\s*\n[\s\S]*?(?=\n#{1,3}\s+(?!table\s+of\s+contents|index|contents)|\n---|$)/gi,
                  ""
                )
                .trim()
            )
            .filter((p) => p.length > 0);

    const estimateTableRowLines = (rowLine: string): number => {
      const cells = rowLine
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.replace(/\*\*/g, "").trim());
      if (cells.length === 0) return 1.35;
      const proseCells = cells.filter((c) => c.length > 12);
      if (proseCells.length === 0) return 1.3;
      const charsPerProseColLine =
        proseCells.length === 1 ? 62 : proseCells.length === 2 ? 40 : proseCells.length === 3 ? 28 : 22;
      const maxLinesInAnyCell = Math.max(
        1,
        ...proseCells.map((c) => Math.ceil(c.length / charsPerProseColLine))
      );
      return Math.max(1.35, maxLinesInAnyCell * 1.05);
    };

    const estimateLines = (markdown: string): number => {
      if (!markdown || !markdown.trim()) return 0;
      let total = 0;
      const withoutCode = markdown.replace(/```[\s\S]*?```/g, (block) => {
        const isMermaid = /^```mermaid/i.test(block.trim());
        total += isMermaid ? 8.5 : Math.min(10, Math.max(4, block.split("\n").length * 0.85));
        return "";
      });
      for (const raw of withoutCode.split("\n")) {
        const line = raw.trim();
        if (!line) {
          total += 0.35;
          continue;
        }
        if (/^#\s+/.test(line)) total += 2.4;
        else if (/^##\s+/.test(line)) total += 1.9;
        else if (/^###\s+/.test(line)) total += 1.6;
        else if (/^\|.*\|$/.test(line)) {
          if (!/^\|[\s\-:|]+\|$/.test(line)) {
            total += estimateTableRowLines(line);
          }
        } else if (/^([-*+]|\d+\.)\s+/.test(line)) {
          const len = line.replace(/\*\*/g, "").length;
          total += Math.max(1.3, Math.ceil(len / 66) * 1.1);
        } else {
          const len = line.replace(/\*\*/g, "").length;
          total += Math.max(1.15, Math.ceil(len / 70) * 1.08);
        }
      }
      return total;
    };

    // Only keep pre-split pages directly if none of them are under-filled or split mid-table
    const hasUnderfilledOrSplitTablePages =
      cleanedPages.length > 1 &&
      (resultType === "verbatim-handwriting" ||
        cleanedPages.some((p, idx) => idx < cleanedPages.length - 1 && estimateLines(p) < 22) ||
        estimateLines(cleanedPages[cleanedPages.length - 1]) < 12);

    if (cleanedPages.length > 1 && !hasUnderfilledOrSplitTablePages) {
      return cleanedPages;
    }

    // Pack atomic blocks continuously into full A4 sheets and coalesce any split chunks of the same Markdown table
    const singleText = cleanedPages.join("\n\n") || displayedResultText;
    const fences: string[] = [];
    const token = "__FENCE_BLOCK_";
    const safeFullText = singleText
      .replace(/---SET_SEPARATOR---/g, "\n\n")
      .replace(/[\s\-_*"'`]*PAGE_BREAK[\s\-_*"'`]*/gi, "\n\n")
      .replace(/```[\s\S]*?```/g, (m) => {
        fences.push(m);
        return `${token}${fences.length - 1}__`;
      });

    const rawBlocks = safeFullText
      .split(/\n\s*\n/)
      .map((b) => b.replace(/__FENCE_BLOCK_(\d+)__/g, (_, idx) => fences[Number(idx)] || "").trim())
      .filter(
        (b) =>
          b.length > 0 &&
          (resultType === "verbatim-handwriting" || !/^#{1,4}\s*(?:table\s+of\s+contents|index)\s*$/i.test(b))
      );

    // Coalesce consecutive Markdown pipe table blocks that share the exact same header row
    const coalescedBlocks: string[] = [];
    for (const block of rawBlocks) {
      const prev = coalescedBlocks[coalescedBlocks.length - 1];
      if (prev && /^\|.*\|$/m.test(prev) && /^\|.*\|$/m.test(block)) {
        const prevLines = prev.split("\n").map((l) => l.trim()).filter(Boolean);
        const curLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const prevPipeLines = prevLines.filter((l) => l.startsWith("|"));
        const curPipeLines = curLines.filter((l) => l.startsWith("|"));
        const curNonPipe = curLines.filter((l) => !l.startsWith("|"));
        if (
          prevPipeLines.length >= 2 &&
          curPipeLines.length >= 2 &&
          curNonPipe.length === 0 &&
          prevPipeLines[0].replace(/\s+/g, " ").toLowerCase() ===
            curPipeLines[0].replace(/\s+/g, " ").toLowerCase()
        ) {
          const curDataRows = /^\|[\s\-:|]+\|$/.test(curPipeLines[1])
            ? curPipeLines.slice(2)
            : curPipeLines.slice(1);
          coalescedBlocks[coalescedBlocks.length - 1] = `${prev}\n${curDataRows.join("\n")}`;
          continue;
        }
      }
      coalescedBlocks.push(block);
    }

    const MIN_FULL_A4_LINES = 25;
    const TARGET_FULL_A4_LINES = 29;
    const MAX_FULL_A4_LINES = 32;

    // Split any extra-large table block so it fills each page completely without leaving orphan rows
    const splitLargeTableBlocks: string[] = [];
    for (const block of coalescedBlocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const pipeLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
      const nonPipeLines = lines.filter((l) => !l.startsWith("|"));
      if (pipeLines.length > 3 && estimateLines(block) > MAX_FULL_A4_LINES) {
        if (nonPipeLines.length > 0) {
          splitLargeTableBlocks.push(nonPipeLines.join("\n"));
        }
        const headerLine = pipeLines[0];
        const isSep = /^\|[\s\-:|]+\|$/.test(pipeLines[1]);
        const colCount = Math.max(1, headerLine.split("|").length - 2);
        const sepLine = isSep ? pipeLines[1] : `| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`;
        const dataRows = isSep ? pipeLines.slice(2) : pipeLines.slice(1);

        const slices: string[][] = [];
        let curSlice: string[] = [];
        let curLines = 1.8;
        for (const r of dataRows) {
          const rLines = estimateTableRowLines(r);
          if (curSlice.length > 0 && curLines + rLines > 28) {
            slices.push(curSlice);
            curSlice = [r];
            curLines = 1.8 + rLines;
          } else {
            curSlice.push(r);
            curLines += rLines;
          }
        }
        if (curSlice.length > 0) {
          if (slices.length > 0 && curSlice.length <= 4) {
            slices[slices.length - 1].push(...curSlice);
          } else {
            slices.push(curSlice);
          }
        }
        for (const s of slices) {
          splitLargeTableBlocks.push([headerLine, sepLine, ...s].join("\n"));
        }
      } else {
        splitLargeTableBlocks.push(block);
      }
    }

    const mergedBlocks: string[] = [];
    for (let i = 0; i < splitLargeTableBlocks.length; i++) {
      const cur = splitLargeTableBlocks[i];
      if (/^#{1,4}\s+[^\n]+$/.test(cur) && i + 1 < splitLargeTableBlocks.length) {
        mergedBlocks.push(`${cur}\n\n${splitLargeTableBlocks[i + 1]}`);
        i++;
      } else {
        mergedBlocks.push(cur);
      }
    }

    const packedPages: string[] = [];
    let currentBlocks: string[] = [];
    let currentLines = 0;

    for (const block of mergedBlocks) {
      const bLines = estimateLines(block);
      if (currentBlocks.length > 0 && currentLines + bLines > MAX_FULL_A4_LINES && currentLines >= MIN_FULL_A4_LINES - 4) {
        packedPages.push(currentBlocks.join("\n\n"));
        currentBlocks = [block];
        currentLines = bLines;
      } else {
        currentBlocks.push(block);
        currentLines += bLines + 0.45;
        if (currentLines >= TARGET_FULL_A4_LINES) {
          packedPages.push(currentBlocks.join("\n\n"));
          currentBlocks = [];
          currentLines = 0;
        }
      }
    }
    if (currentBlocks.length > 0) {
      if (packedPages.length > 0 && currentLines < 11) {
        packedPages[packedPages.length - 1] = `${packedPages[packedPages.length - 1]}\n\n${currentBlocks.join("\n\n")}`;
      } else {
        packedPages.push(currentBlocks.join("\n\n"));
      }
    }

    return packedPages.length > 0 ? packedPages : [singleText];
  }, [displayedResultText, resultType]);

  const getHandwritingFontFamily = (fontClass?: string): string => {
    switch (fontClass) {
      case "font-handwriting-indie":
        return '"Indie Flower", cursive';
      case "font-handwriting-kalam":
        return '"Kalam", cursive';
      case "font-handwriting-shadows":
        return '"Shadows Into Light", cursive';
      case "font-handwriting-patrick":
        return '"Patrick Hand", cursive';
      case "font-handwriting":
      default:
        return '"Caveat", cursive';
    }
  };

  const handwrittenTocEntries = useMemo(() => {
    return pagesToRender.map((pageMd, idx) => {
      const headingMatch =
        pageMd.match(/^#\s+([^\n]+)/m) ||
        pageMd.match(/^##\s+([^\n]+)/m) ||
        pageMd.match(/^###\s+([^\n]+)/m);
      const rawTitle = headingMatch
        ? headingMatch[1]
            .replace(/[*_`~#]/g, "")
            .replace(/^Comprehensive Handwritten Study Sheet \d+:\s*/i, "")
            .trim()
        : `Study Topic & Conceptual Notes — Sheet ${idx + 1}`;
      return {
        srNo: idx + 1,
        title: rawTitle.slice(0, 68),
        pageNumber: idx + 1,
      };
    });
  }, [pagesToRender]);

  const scrollToSummaryPage = (targetIdx: number) => {
    const boundedIdx = Math.max(0, Math.min(pagesToRender.length - 1, targetIdx));
    setCurrentPageIndex(boundedIdx);
    if (summaryViewMode === "continuous") {
      const el = document.getElementById(`summary-page-${boundedIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      notesViewerRef.current?.scrollTo({ top: 0, left: 0 });
    }
  };

  const handleNotesViewerScroll = () => {
    if (summaryViewMode !== "continuous" || !notesViewerRef.current || pagesToRender.length <= 1) return;
    const container = notesViewerRef.current;
    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < pagesToRender.length; i++) {
      const el = document.getElementById(`summary-page-${i}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= containerRect.top + 200 && rect.bottom >= containerRect.top + 50) {
          if (currentPageIndex !== i) {
            setCurrentPageIndex(i);
          }
          break;
        }
      }
    }
  };

  const seenActivityKeys = new Set<string>();
  const uniqueHistoryItems = history.filter((item) => {
    const activityKey = `${item.fileUri || item.id}|${item.type}|${item.title}`;
    if (seenActivityKeys.has(activityKey)) return false;
    seenActivityKeys.add(activityKey);
    return true;
  });
  const savedNotesCount = uniqueHistoryItems.filter((item) => item.type === "notes").length;
  const practiceSetsCount = uniqueHistoryItems.filter((item) => ["flashcards", "assessment", "question-bank", "exam-paper"].includes(item.type)).length;
  const studySourcesCount = new Set(uniqueHistoryItems.map((item) => item.fileUri).filter(Boolean)).size;

  const navigateToSection = (section: "materials" | "library" | "tools" | "learning" | "storage") => {
    if (section === "storage") {
      setSettingsTab("storage");
      setShowSettings(true);
      return;
    }
    setActiveNav(section);
    if (section === "materials" || section === "tools") {
      setIsSidebarOpen(true);
    }
    if (section === "materials") setInputType("upload");
    const targetId =
      section === "library"
        ? "dashboard-library"
        : section === "tools"
          ? "learning-tools"
          : section === "learning"
            ? "learning-content"
            : "material-source";
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const runQuickTool = (toolAction: () => void | Promise<void>) => {
    if (!fileData) {
      navigateToSection("materials");
      return;
    }
    void toolAction();
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please verify camera permissions or try on a device with a webcam.");
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.95));
    stopCamera();
  };

  const confirmScan = async () => {
    if (!capturedPhoto) return;
    setLoading(true);
    setError(null);
    setIsScannerOpen(false);
    try {
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const scannedFile = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(scannedFile);
      const data = await uploadDocumentToServer(scannedFile);
      setFileData({ fileUri: data.fileUri, mimeType: data.mimeType });
      setResultText("");
      setResultType("");
      setFlashcards([]);
      setGeneratedFunctionsCache({});
      setShowDigitalScannerHub(true);
      if (data.digitalScan) {
        setDigitalScanReport(data.digitalScan);
        setScannedDigitalText(data.extractedText || data.digitalScan.textPreview || "");
        if (data.digitalScan.units?.length) {
          setDetectedUnits(data.digitalScan.units);
        }
      }
      await saveUploadedDocumentToVault(userStorageKey, {
        id: `doc:${data.fileUri}`,
        fileName: scannedFile.name,
        mimeType: data.mimeType || "image/jpeg",
        fileSize: scannedFile.size,
        fileUri: data.fileUri,
        uploadSource: "Optical Camera Scan",
        extractedText: data.extractedText || data.digitalScan?.textPreview || "",
        digitalScan: data.digitalScan || null,
        detectedUnits: data.digitalScan?.units || [],
        fileBlob: scannedFile,
      });
      setStorageRefreshTick((t) => t + 1);
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setCapturedPhoto(null);
    }
  };

  const runEasyOCR = async (targetFile?: File, base64Data?: string) => {
    const fileToProcess = targetFile || file;
    if (!fileToProcess && !base64Data && !fileData?.fileUri) {
      setError("Please upload a digital document, select an image, or scan a page to run EasyOCR text extraction.");
      return;
    }

    setOcrLoading(true);
    setIsOcrModalOpen(true);
    setError(null);

    if (base64Data) {
      setOcrPreviewImage(base64Data);
    } else if (fileToProcess && fileToProcess.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(fileToProcess);
      setOcrPreviewImage(previewUrl);
    } else {
      setOcrPreviewImage(null);
    }

    try {
      let data: any;
      if (base64Data) {
        data = await apiFetchJson("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
      } else if (fileToProcess && fileToProcess.size > 0) {
        const formData = new FormData();
        formData.append("image", fileToProcess);
        if (fileData?.fileUri) {
          formData.append("fileUri", fileData.fileUri);
          formData.append("mimeType", fileData.mimeType);
        }
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `EasyOCR error (${res.status})`);
        }
        data = await res.json();
      } else if (fileData?.fileUri) {
        data = await apiFetchJson("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType }),
        });
      }

      setOcrResult(data);
      if (data?.text) {
        setScannedDigitalText(data.text);
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleApplyOcrToWorkspace = (text: string, fileUri?: string) => {
    const uri = fileUri || fileData?.fileUri || `text:ocr-${Date.now()}`;
    setFileData({ fileUri: uri, mimeType: "text/plain" });
    setScannedDigitalText(text);
    setGeneratedResultText(text);
    setResultType("notes");
    setShowDigitalScannerHub(false);
    setGeneratingType("");
  };

  const persistStudyOutputToUserVault = async (
    payload: Omit<StoredStudyItem, "id" | "userKey" | "createdAtMs" | "updatedAtMs" | "sizeBytes"> & {
      id?: string;
      createdAtMs?: number;
    }
  ) => {
    const itemId =
      payload.id ||
      `vault:${payload.type}:${(payload.fileUri || payload.title || "doc").slice(-36)}:${Date.now()}`;
    const storedItem = await saveStudyItemToVault(userStorageKey, {
      id: itemId,
      title: payload.title || "Untitled Study Output",
      type: payload.type || "notes",
      notesVersion: payload.notesVersion,
      questionBankType: payload.questionBankType,
      questionBankBloomLevel: payload.questionBankBloomLevel,
      qbVersion: payload.qbVersion,
      fileUri: payload.fileUri || "",
      mimeType: payload.mimeType || "text/plain",
      resultText: payload.resultText || "",
      flashcards: payload.flashcards || [],
      lessonPlan: payload.lessonPlan || null,
      slides: payload.slides || [],
      videoData: payload.videoData || null,
      focusArea: payload.focusArea || "",
      createdAt: payload.createdAtMs || Date.now(),
      createdAtMs: payload.createdAtMs || Date.now(),
    });
    setHistory((prev) => {
      const filtered = prev.filter(
        (existing) =>
          existing.id !== storedItem.id &&
          !(
            existing.fileUri === storedItem.fileUri &&
            existing.type === storedItem.type &&
            existing.title === storedItem.title &&
            (existing.questionBankType || "") === (storedItem.questionBankType || "")
          )
      );
      return [storedItem as unknown as HistoryItem, ...filtered];
    });
    setStorageRefreshTick((t) => t + 1);
    return storedItem;
  };

  useEffect(() => {
    let isMounted = true;
    setHistoryLoading(true);

    const loadFromLocalVault = async () => {
      try {
        const localItems = await listStudyItemsFromVault(userStorageKey);
        if (!isMounted) return;
        const normalizedLocal: HistoryItem[] = localItems.map((item) => ({
          id: item.id,
          title: item.title || "Untitled Document",
          type: item.type || "notes",
          notesVersion: item.notesVersion,
          questionBankType: item.questionBankType as any,
          questionBankBloomLevel: item.questionBankBloomLevel as any,
          fileUri: item.fileUri || "",
          mimeType: item.mimeType || "",
          resultText: normalizeGeneratedContent(item.resultText || ""),
          flashcards: normalizeGeneratedFlashcards(item.flashcards || []),
          lessonPlan: item.lessonPlan || null,
          slides: item.slides || undefined,
          videoData: item.videoData || null,
          focusArea: item.focusArea || "",
          createdAt: item.createdAt || item.createdAtMs,
        }));
        setHistory((prev) => {
          const mergedMap = new Map<string, HistoryItem>();
          for (const it of [...normalizedLocal, ...prev]) {
            const key = `${it.fileUri || it.id}|${it.type}|${it.title}|${it.questionBankType || ""}`;
            if (!mergedMap.has(key)) mergedMap.set(key, it);
          }
          return Array.from(mergedMap.values());
        });
      } catch (e) {
        console.warn("Could not load local vault study items:", e);
      } finally {
        if (isMounted && !user) {
          setHistoryLoading(false);
        }
      }
    };

    void loadFromLocalVault();

    if (!user) {
      return () => {
        isMounted = false;
      };
    }

    const q = query(
      collection(db, "users", user.uid, "documents"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const firestoreItems: HistoryItem[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const item: HistoryItem = {
            id: docSnapshot.id,
            title: data.title || "Untitled Document",
            type: data.type || "notes",
            notesVersion: data.notesVersion,
            questionBankType: data.questionBankType,
            questionBankBloomLevel: data.questionBankBloomLevel,
            fileUri: data.fileUri || "",
            mimeType: data.mimeType || "",
            resultText: normalizeGeneratedContent(data.resultText || ""),
            flashcards: normalizeGeneratedFlashcards(data.flashcards || []),
            lessonPlan: data.lessonPlan || null,
            slides: data.slides || undefined,
            videoData: data.videoData || null,
            focusArea: data.focusArea || "",
            createdAt: data.createdAt,
          };
          firestoreItems.push(item);
        });

        const localItems = await listStudyItemsFromVault(userStorageKey);
        const normalizedLocal: HistoryItem[] = localItems.map((item) => ({
          id: item.id,
          title: item.title || "Untitled Document",
          type: item.type || "notes",
          notesVersion: item.notesVersion,
          questionBankType: item.questionBankType as any,
          questionBankBloomLevel: item.questionBankBloomLevel as any,
          fileUri: item.fileUri || "",
          mimeType: item.mimeType || "",
          resultText: normalizeGeneratedContent(item.resultText || ""),
          flashcards: normalizeGeneratedFlashcards(item.flashcards || []),
          lessonPlan: item.lessonPlan || null,
          slides: item.slides || undefined,
          videoData: item.videoData || null,
          focusArea: item.focusArea || "",
          createdAt: item.createdAt,
        }));

        const mergedMap = new Map<string, HistoryItem>();
        for (const it of [...firestoreItems, ...normalizedLocal]) {
          const key = `${it.fileUri || it.id}|${it.type}|${it.title}|${it.questionBankType || ""}`;
          if (!mergedMap.has(key)) mergedMap.set(key, it);
        }

        if (isMounted) {
          setHistory(Array.from(mergedMap.values()));
          setHistoryLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching document history:", err);
        if (isMounted) setHistoryLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, userStorageKey, storageRefreshTick]);

  // Restore last active workspace snapshot from user storage on startup
  useEffect(() => {
    let cancelled = false;
    hasRestoredWorkspaceRef.current = false;
    const restoreSnapshot = async () => {
      try {
        const snap = await loadWorkspaceSnapshot(userStorageKey);
        if (cancelled || !snap) return;
        if (snap.preferences) {
          if (snap.preferences.mode) setMode(snap.preferences.mode as any);
          if (snap.preferences.pageStyle) setPageStyle(snap.preferences.pageStyle as any);
          if (snap.preferences.penColor) setPenColor(snap.preferences.penColor as any);
          if (snap.preferences.handwritingFont) setHandwritingFont(snap.preferences.handwritingFont as any);
          if (typeof snap.preferences.isDarkMode === "boolean") setIsDarkMode(snap.preferences.isDarkMode);
          if (snap.preferences.uiZoomMode) setUiZoomMode(snap.preferences.uiZoomMode as any);
          if (snap.preferences.selectedAiModel) setSelectedAiModel(snap.preferences.selectedAiModel as any);
          if (snap.preferences.focusArea) setFocusArea(snap.preferences.focusArea);
          if (snap.preferences.selectedUnit) setSelectedUnit(snap.preferences.selectedUnit);
          if (snap.preferences.selectedChapter) setSelectedChapter(snap.preferences.selectedChapter);
        }
        if (snap.completedSessions && typeof snap.completedSessions === "object" && !Array.isArray(snap.completedSessions)) {
          setCompletedSessions(snap.completedSessions as Record<string, boolean>);
        }
        // Only auto-restore workspace document if none is currently loaded
        if (!fileData && snap.activeFileUri) {
          const storedDoc = await getUploadedDocumentFromVault(snap.activeFileUri).catch(() => null);
          const restoredText =
            snap.scannedDigitalText ||
            storedDoc?.extractedText ||
            snap.digitalScanReport?.textPreview ||
            "";
          const hasBinaryBlob = Boolean(storedDoc?.blob && storedDoc.blob.size > 0);
          const isSpecialUri =
            snap.activeFileUri.startsWith("book:") ||
            snap.activeFileUri.startsWith("link:") ||
            snap.activeFileUri.startsWith("text:");

          const effectiveUri =
            hasBinaryBlob || isSpecialUri
              ? snap.activeFileUri
              : restoredText
              ? `text:restored-${encodeURIComponent(snap.activeFileName || "doc")}`
              : snap.activeFileUri;
          const effectiveMime =
            hasBinaryBlob
              ? snap.activeMimeType || storedDoc?.mimeType || "application/pdf"
              : isSpecialUri
              ? snap.activeMimeType || "text/plain"
              : "text/plain";

          setFileData({
            fileUri: effectiveUri,
            mimeType: effectiveMime,
          });

          if (hasBinaryBlob && storedDoc?.blob) {
            setFile(
              new File([storedDoc.blob], snap.activeFileName || storedDoc.fileName || "Document.pdf", {
                type: effectiveMime,
              })
            );
          } else if (restoredText && snap.activeFileName) {
            const safeTxtName = snap.activeFileName.replace(/\.[^.]+$/, "") + ".txt";
            setFile(new File([restoredText], safeTxtName, { type: "text/plain" }));
          }

          if (restoredText) {
            setScannedDigitalText(restoredText);
            extractedTextCacheRef.current.set(effectiveUri, restoredText);
            extractedTextCacheRef.current.set(snap.activeFileUri, restoredText);
          }
          if (snap.digitalScanReport) {
            setDigitalScanReport(snap.digitalScanReport);
          }
          if (Array.isArray(snap.detectedUnits) && snap.detectedUnits.length > 0) {
            setDetectedUnits(snap.detectedUnits);
          }
          if (snap.generatedFunctionsCache && Object.keys(snap.generatedFunctionsCache).length > 0) {
            setGeneratedFunctionsCache(snap.generatedFunctionsCache);
          }
          if (snap.resultType) {
            setResultType(snap.resultType as any);
          }
          if (snap.resultText) {
            setResultText(snap.resultText);
            setShowDigitalScannerHub(false);
          }
          if (snap.activeMultiFunctionTitle) {
            setActiveMultiFunctionTitle(snap.activeMultiFunctionTitle);
          }
          if (Array.isArray(snap.flashcards) && snap.flashcards.length > 0) {
            setFlashcards(snap.flashcards);
          }
          if (Array.isArray(snap.slides) && snap.slides.length > 0) {
            setSlides(snap.slides);
          }
          if (snap.videoData) {
            setVideoData(snap.videoData);
          }
          if (snap.lessonPlan) {
            setLessonPlan(snap.lessonPlan);
          }
        }
      } catch (err) {
        console.warn("Could not restore workspace snapshot:", err);
      } finally {
        if (!cancelled) {
          hasRestoredWorkspaceRef.current = true;
        }
      }
    };
    void restoreSnapshot();
    return () => {
      cancelled = true;
    };
  }, [userStorageKey]);

  // Auto-save active workspace & preferences into user storage
  useEffect(() => {
    if (!hasRestoredWorkspaceRef.current) return;
    const timer = window.setTimeout(() => {
      void saveWorkspaceSnapshot(userStorageKey, {
        activeFileName: file?.name || digitalScanReport?.documentTitle || "",
        activeFileUri: fileData?.fileUri || "",
        activeMimeType: fileData?.mimeType || "",
        scannedDigitalText,
        digitalScanReport,
        detectedUnits,
        resultText,
        resultType,
        activeMultiFunctionTitle,
        flashcards,
        slides,
        videoData,
        lessonPlan,
        generatedFunctionsCache,
        completedSessions,
        preferences: {
          mode,
          pageStyle,
          penColor,
          handwritingFont,
          isDarkMode,
          uiZoomMode,
          selectedAiModel,
          focusArea,
          selectedUnit,
          selectedChapter,
        },
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [
    userStorageKey,
    file,
    fileData,
    scannedDigitalText,
    digitalScanReport,
    detectedUnits,
    resultText,
    resultType,
    activeMultiFunctionTitle,
    flashcards,
    slides,
    videoData,
    lessonPlan,
    generatedFunctionsCache,
    completedSessions,
    mode,
    pageStyle,
    penColor,
    handwritingFont,
    isDarkMode,
    uiZoomMode,
    selectedAiModel,
    focusArea,
    selectedUnit,
    selectedChapter,
  ]);

  const handleSaveCurrentWorkspaceToVault = async () => {
    await saveWorkspaceSnapshot(userStorageKey, {
      activeFileName: file?.name || digitalScanReport?.documentTitle || "",
      activeFileUri: fileData?.fileUri || "",
      activeMimeType: fileData?.mimeType || "",
      scannedDigitalText,
      digitalScanReport,
      detectedUnits,
      resultText,
      resultType,
      activeMultiFunctionTitle,
      flashcards,
      slides,
      videoData,
      lessonPlan,
      generatedFunctionsCache,
      completedSessions,
      preferences: {
        mode,
        pageStyle,
        penColor,
        handwritingFont,
        isDarkMode,
        uiZoomMode,
        selectedAiModel,
        focusArea,
        selectedUnit,
        selectedChapter,
      },
    });
    if (fileData && (resultText || flashcards.length > 0 || slides.length > 0 || videoData || lessonPlan)) {
      await persistStudyOutputToUserVault({
        title:
          activeMultiFunctionTitle ||
          file?.name ||
          digitalScanReport?.documentTitle ||
          "Saved Workspace Study Output",
        type: resultType || (flashcards.length > 0 ? "flashcards" : "notes"),
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText,
        flashcards,
        lessonPlan,
        slides,
        videoData,
        focusArea,
      });
    }
    setStorageRefreshTick((t) => t + 1);
  };

  const handleOpenStoredUploadFromVault = async (docMeta: StoredUploadedDocument) => {
    setLoading(true);
    setError(null);
    try {
      const storedRecord = await getUploadedDocumentFromVault(docMeta.id);
      const docText = storedRecord?.extractedText || docMeta.extractedText || docMeta.digitalScan?.textPreview || "";
      const hasBinaryBlob = Boolean(storedRecord?.blob && storedRecord.blob.size > 0);
      let activeFileObj: File | null = null;
      let effectiveUri = docMeta.fileUri;
      let effectiveMime = docMeta.mimeType || "text/plain";

      if (hasBinaryBlob && storedRecord?.blob) {
        activeFileObj = new File([storedRecord.blob], docMeta.fileName, {
          type: docMeta.mimeType || "application/octet-stream",
        });
      } else if (docText) {
        const safeTxtName = (docMeta.fileName || "Document").replace(/\.[^.]+$/, "") + ".txt";
        activeFileObj = new File([docText], safeTxtName, {
          type: "text/plain",
        });
        if (!effectiveUri.startsWith("text:") && !effectiveUri.startsWith("book:") && !effectiveUri.startsWith("link:")) {
          effectiveUri = `text:vault-${encodeURIComponent(docMeta.id || docMeta.fileName)}`;
        }
        effectiveMime = "text/plain";
      }

      if (activeFileObj) {
        setFile(activeFileObj);
      }
      setFileData({ fileUri: effectiveUri, mimeType: effectiveMime });
      if (docText) {
        setScannedDigitalText(docText);
        extractedTextCacheRef.current.set(effectiveUri, docText);
        extractedTextCacheRef.current.set(docMeta.fileUri, docText);
      }
      if (docMeta.digitalScan) {
        setDigitalScanReport(docMeta.digitalScan);
      }
      if (Array.isArray(docMeta.detectedUnits) && docMeta.detectedUnits.length > 0) {
        setDetectedUnits(docMeta.detectedUnits);
      }
      setShowDigitalScannerHub(true);
      setActiveNav("materials");
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem | StoredStudyItem) => {
    if (item.title && item.title.startsWith("scan-")) {
      setInputType("scan");
    } else {
      setInputType("upload");
    }

    setFileData({ fileUri: item.fileUri, mimeType: item.mimeType });
    setGeneratedResultText(item.resultText || "");
    setResultType(item.type as any);
    setGeneratedFlashcards(item.flashcards || []);
    setLessonPlan(item.lessonPlan || null);
    setVideoData(item.videoData || null);
    setShowDigitalScannerHub(false);
    if (item.focusArea) {
      setFocusArea(item.focusArea);
      setSelectedPPTTopic(item.focusArea);
    }
    if (item.slides && item.slides.length > 0) {
      setSlides(item.slides);
    }
    if (activeNav === "storage") {
      setActiveNav("learning");
    }
  };

  const pendingBookSuggestionRef = useRef<UploadedBookSuggestionAction | null>(null);

  const handleStudyLibraryBook = async (
    book: LibraryBook,
    suggestionAction?: LibraryBookSuggestionAction
  ) => {
    setBusyLibraryBookId(book.id);
    setLoading(true);
    setError(null);
    try {
      let fileUri = book.fileUri || book.id;
      let mimeType = book.mimeType || "text/plain";
      let studyFile = new File([], `[Library Book] ${book.title}`);
      let uploadedScan: DigitalScanReport | undefined;
      let uploadedText: string | undefined;

      if (book.storageType === "file") {
        const savedFile = await getSavedLibraryBookFile(book.id);
        if (!savedFile) throw new Error("This saved PDF is missing from this browser. Add it to your library again.");

        const data = await uploadDocumentToServer(savedFile);
        fileUri = data.fileUri;
        mimeType = data.mimeType || savedFile.type || "application/pdf";
        studyFile = savedFile;
        uploadedScan = data.digitalScan;
        uploadedText = data.extractedText;
      } else if (book.storageType === "link" && book.sourceUrl) {
        fileUri = `link:${book.sourceUrl}`;
      }

      if (suggestionAction) {
        const mappedAction: UploadedBookSuggestionAction =
          suggestionAction === "questions"
            ? { type: "questions-short" }
            : suggestionAction === "question-bank"
              ? { type: "question-bank-all" }
              : suggestionAction === "flashcards"
                ? { type: "flashcards" }
                : suggestionAction === "exam-paper"
                  ? { type: "exam-paper-university" }
                  : suggestionAction === "notes"
                    ? { type: "notes" }
                    : { type: "ppt" };
        pendingBookSuggestionRef.current = mappedAction;
      }

      setFileData({ fileUri, mimeType });
      setFile(studyFile);
      setResultText("");
      setResultType("");
      setFlashcards([]);
      setLessonPlan(null);
      setCompletedSessions({});
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setVideoData(null);
      setSlides([]);
      setGeneratedFunctionsCache({});
      setActiveScanFocusTopic("");
      setShowDigitalScannerHub(true);
      navigateToSection("materials");

      if (uploadedScan) {
        setDigitalScanReport(uploadedScan);
        setScannedDigitalText(uploadedText || uploadedScan.textPreview || "");
        if (uploadedScan.units?.length) {
          setDetectedUnits(uploadedScan.units);
        }
      } else {
        void scanDigitalDocument(fileUri, mimeType, book.title, false);
      }
    } catch (studyError) {
      handleFetchError(studyError);
    } finally {
      setLoading(false);
      setBusyLibraryBookId(null);
    }
  };

  const handleAddBookLink = async (rawUrl: string, department: string): Promise<LibraryBook> => {
    let sourceUrl: URL;
    try {
      sourceUrl = new URL(rawUrl);
    } catch {
      throw new Error("Enter a valid book link.");
    }
    const hostname = sourceUrl.hostname.toLowerCase();
    const googleBooksHost = /^books\.google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)$/.test(hostname) || hostname === "play.google.com";
    const isPrivateIpv4 = (() => {
      const address = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!address) return false;
      const [first, second] = address.slice(1).map(Number);
      return first === 0 || first === 10 || first === 127 || first >= 224
        || (first === 169 && second === 254)
        || (first === 172 && second >= 16 && second <= 31)
        || (first === 192 && second === 168);
    })();
    const isLocalHost = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local");
    if (sourceUrl.protocol !== "https:" || sourceUrl.username || sourceUrl.password || !hostname.includes(".") || isLocalHost || isPrivateIpv4 || hostname.startsWith("[")) {
      throw new Error("Enter a secure public book link, such as Google Books or a direct PDF URL.");
    }

    const volumeId = googleBooksHost
      ? sourceUrl.searchParams.get("id")
        || sourceUrl.pathname.match(/\/(?:edition|details)\/[^/]+\/([A-Za-z0-9_-]{6,})/)?.[1]
        || ""
      : "";
    let volumeInfo: { title?: string; authors?: string[]; description?: string } = {};
    if (volumeId) {
      try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(volumeId)}`);
        if (response.ok) {
          const data = await response.json();
          volumeInfo = data.volumeInfo || {};
        }
      } catch {
        // Keep the link usable when the metadata service is unavailable.
      }
    }

    let fallbackTitle = googleBooksHost ? "Google Books item" : "Linked book";
    try {
      fallbackTitle = decodeURIComponent(sourceUrl.pathname.split("/").filter(Boolean).pop() || fallbackTitle);
    } catch {
      // Keep a generic title if the URL contains an invalid escape sequence.
    }
    fallbackTitle = fallbackTitle
      .replace(/\+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    fallbackTitle = fallbackTitle.replace(/\.pdf$/i, "");
    if (["books", "details", "edition"].includes(fallbackTitle.toLowerCase())) fallbackTitle = "Google Books item";
    const isPdfLink = /\.pdf$/i.test(sourceUrl.pathname);
    const book: SavedLibraryBook = {
      id: `personal:${crypto.randomUUID()}`,
      title: volumeInfo.title || fallbackTitle || (googleBooksHost ? "Google Books item" : "Linked book"),
      author: volumeInfo.authors?.join(", ") || "Unknown author",
      desc: volumeInfo.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000)
        || (isPdfLink ? "PDF book saved from a web link." : "Book saved from a web link."),
      department,
      sourceUrl: sourceUrl.toString(),
      fileUri: `link:${sourceUrl.toString()}`,
      mimeType: "text/plain",
      storageType: "link",
      createdAt: Date.now(),
    };
    await saveLibraryBook(book);
    setPersonalLibraryBooks((current) => [book, ...current]);
    return book;
  };

  const handleAddLocalBook = async (fileToSave: File, department: string): Promise<LibraryBook> => {
    const validDigitalDoc = /\.(pdf|docx|doc|pptx|ppt|xlsx|xls|odt|rtf|txt|md|markdown|csv|tsv|json|html|htm|xml|tex)$/i.test(fileToSave.name) ||
      fileToSave.type === "application/pdf" ||
      fileToSave.type.startsWith("text/") ||
      fileToSave.type.includes("officedocument");
    if (!validDigitalDoc) {
      throw new Error("Choose a supported digital document file (.PDF, .DOCX, .PPTX, .XLSX, .TXT, .MD, .CSV, .RTF, .HTML).");
    }
    const book: SavedLibraryBook = {
      id: `personal:${crypto.randomUUID()}`,
      title: fileToSave.name.replace(/\.[^/.]+$/, "") || fileToSave.name,
      author: "Added from this device",
      desc: "Digital document file saved in this browser's local library.",
      department,
      mimeType: fileToSave.type || "application/pdf",
      storageType: "file",
      fileName: fileToSave.name,
      createdAt: Date.now(),
    };
    await saveLibraryBook(book, fileToSave);
    setPersonalLibraryBooks((current) => [book, ...current]);
    return book;
  };

  const handleRemoveLibraryBook = async (book: LibraryBook) => {
    if (!book.storageType) return;
    await deleteSavedLibraryBook(book.id);
    setPersonalLibraryBooks((current) => current.filter((savedBook) => savedBook.id !== book.id));
  };

  const handleDownloadLibraryBook = async (book: LibraryBook) => {
    if (book.storageType === "file") {
      const savedFile = await getSavedLibraryBookFile(book.id);
      if (!savedFile) {
        setError("This PDF could not be found in this browser's local storage.");
        return;
      }
      const fileUrl = URL.createObjectURL(savedFile);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = book.fileName || savedFile.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      return;
    }

    const textContent = `STUDY BOOK COMPANION: ${book.title.toUpperCase()}
Author: ${book.author}
Department: ${book.department}

Description:
${book.desc || "No description available."}

${book.sourceUrl ? `Book link: ${book.sourceUrl}\n\n` : ""}

This study companion can be uploaded to the study panel to generate notes, assessments, presentations, lesson plans, and study guides.
`;
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${book.title.replace(/[^a-zA-Z0-9]/g, "_")}_Companion.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingHistoryId(id);
    setHistoryDeleteError(null);
    try {
      await deleteStudyItemFromVault(id, userStorageKey);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (user && !id.startsWith("vault:")) {
        await deleteDoc(doc(db, "users", user.uid, "documents", id));
      }
      setStorageRefreshTick((t) => t + 1);
    } catch (err) {
      console.error("Error deleting document from history:", err);
      setHistoryDeleteError("Could not remove this study activity. Please try again.");
    } finally {
      setDeletingHistoryId(null);
    }
  };

  const handleSignIn = async () => {
    if (isGoogleSigningInRef.current) return;
    isGoogleSigningInRef.current = true;
    setIsGoogleSigningIn(true);
    setSignInError(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Store user data in Firestore
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || "",
            createdAt: serverTimestamp()
          });
        }
      } catch (dbErr) {
        console.warn("Could not save user profile to Firestore:", dbErr);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err || "");
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        errMsg.includes("Pending promise was never set") ||
        errMsg.includes("INTERNAL ASSERTION FAILED")
      ) {
        // User dismissed the popup or a known transient popup state race occurred in Firebase SDK
        return;
      }
      if (err?.code === "auth/unauthorized-domain" || err?.code === "auth/popup-blocked") {
        sessionStorage.setItem("notivexa_quick_access", "true");
        setIsQuickGuest(true);
        return;
      } else {
        setSignInError(err?.message || "Could not complete Google sign-in. Please use Email & Password above or try again.");
      }
    } finally {
      isGoogleSigningInRef.current = false;
      setIsGoogleSigningIn(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.setItem("notivexa_require_signin", "true");
    sessionStorage.removeItem("notivexa_quick_access");
    setIsQuickGuest(false);
    signOut(auth);
  };

  const requestGoogleDriveAccessToken = async () => {
    if (isDriveAuthRef.current) {
      throw new Error("Google Drive authorization is already in progress.");
    }
    isDriveAuthRef.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.readonly");
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("Google Drive access was not granted.");
      }
      return credential.accessToken;
    } catch (err: any) {
      const errMsg = err?.message || String(err || "");
      if (errMsg.includes("Pending promise was never set") || errMsg.includes("INTERNAL ASSERTION FAILED")) {
        throw new Error("Authorization popup closed before completion. Please try again.");
      }
      throw err;
    } finally {
      isDriveAuthRef.current = false;
    }
  };




  // Text-to-Speech logic with Studio Audio API (/api/tts) and browser fallback
  const handlePlayPauseSpeech = async () => {
    // If studio audio player is active
    if (currentAudioRef.current) {
      if (isSpeaking && !isSpeechPaused) {
        currentAudioRef.current.pause();
        setIsSpeechPaused(true);
      } else if (isSpeaking && isSpeechPaused) {
        currentAudioRef.current.play().catch(() => {});
        setIsSpeechPaused(false);
      }
      return;
    }

    // If browser speech was speaking
    if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
      if (isSpeaking && !isSpeechPaused) {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      } else if (isSpeaking && isSpeechPaused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      }
      return;
    }

    if (!displayedResultText) return;

    // Clean text for speech
    const plainText = displayedResultText
      .replace(/---PAGE_BREAK---/g, " ")
      .replace(/---SET_SEPARATOR---/g, " ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[DIAGRAM:.*?\]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .trim();

    if (!plainText) return;

    setIsAudioLoading(true);

    try {
      // 1. Try backend studio TTS (/api/tts) with ElevenLabs / Google TTS / fast audio stream
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText.slice(0, 1500) }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        if (audioBlob.size > 200) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            setIsSpeechPaused(false);
            currentAudioRef.current = null;
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            setIsSpeechPaused(false);
            currentAudioRef.current = null;
            URL.revokeObjectURL(audioUrl);
          };

          await audio.play();
          setIsSpeaking(true);
          setIsSpeechPaused(false);
          setIsAudioLoading(false);
          return;
        }
      }
    } catch (audioErr) {
      console.warn("Studio TTS stream warning, using browser speech synthesis:", audioErr);
    } finally {
      setIsAudioLoading(false);
    }

    // 2. Fallback to Web Speech API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 3000));
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    }
  };

  const handleStopSpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    setIsAudioLoading(false);
  };
  
  useEffect(() => {
    handleStopSpeech();
  }, [resultText]);

  const apiFetchJson = async (url: string, options?: RequestInit, retries = 3): Promise<any> => {
    let attempt = 0;
    let hasAutoReuploaded = false;
    const retryDelays = [1000, 2000, 3500, 5000];
    let currentOptions: RequestInit | undefined = options ? { ...options } : undefined;

    // Enrich JSON requests that reference fileUri with fallback metadata & cached text
    if (currentOptions && typeof currentOptions.body === "string" && !url.includes("/api/upload")) {
      try {
        const parsed = JSON.parse(currentOptions.body);
        if (parsed && typeof parsed === "object" && parsed.fileUri) {
          parsed.hasLocalFile = Boolean(file);
          parsed.fallbackTitle = parsed.fallbackTitle || file?.name || digitalScanReport?.documentTitle || "";
          parsed.fallbackFocus = parsed.fallbackFocus || focusArea || "";
          if (!parsed.fallbackText) {
            let cachedText =
              extractedTextCacheRef.current.get(parsed.fileUri) ||
              scannedDigitalText ||
              digitalScanReport?.textPreview ||
              "";
            if (!cachedText && typeof window !== "undefined") {
              try {
                cachedText = sessionStorage.getItem(`notivexa_doc_text_${parsed.fileUri}`) || "";
              } catch {
                // ignore storage access errors
              }
            }
            if (!cachedText) {
              const historyMatch = history.find((h) => h.fileUri === parsed.fileUri && h.resultText && h.resultText.length > 100);
              if (historyMatch?.resultText) {
                cachedText = historyMatch.resultText;
              } else if (resultText && resultText.length > 100) {
                cachedText = resultText;
              }
            }
            if (cachedText) {
              parsed.fallbackText = cachedText.slice(0, 120000);
            }
          }
          currentOptions.body = JSON.stringify(parsed);
        }
      } catch {
        // Not a JSON body or unable to parse
      }
    }

    while (true) {
      try {
        const res = await fetch(url, currentOptions);
        const textResponse = await res.text();
        const trimmed = textResponse.trim();
        const isHtml = trimmed.toLowerCase().startsWith("<!doctype html>") || trimmed.toLowerCase().startsWith("<html");

        if (isHtml || res.status === 502 || res.status === 503 || res.status === 504) {
          if (attempt < retries) {
            const delay = retryDelays[attempt] || 2000;
            attempt++;
            console.warn(`[apiFetch] Server busy or warming up (${res.status || 'HTML'}, attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new Error("The server is temporarily busy or updating. Please click 'Try Again Now' in a moment.");
        }

        let data: any;
        try {
          data = JSON.parse(trimmed);
        } catch {
          if (res.status === 413 || trimmed.includes("413")) {
            throw new Error("413 Request Entity Too Large");
          }
          throw new Error(`Server returned non-JSON response: ${trimmed.slice(0, 100)}`);
        }

        if (data && data.error) {
          const errStr = String(data.error);
          if ((errStr.includes("REUPLOAD_REQUIRED") || errStr.toLowerCase().includes("no longer available")) && !hasAutoReuploaded && currentOptions && typeof currentOptions.body === "string") {
            hasAutoReuploaded = true;
            const parsed = JSON.parse(currentOptions.body);
            if (file) {
              console.log("[apiFetch] Server cache miss detected. Automatically re-syncing local file in background...");
              const reuploaded = await uploadDocumentToServer(file);
              setFileData({ fileUri: reuploaded.fileUri, mimeType: reuploaded.mimeType });
              parsed.fileUri = reuploaded.fileUri;
              parsed.hasLocalFile = false;
              currentOptions.body = JSON.stringify(parsed);
              continue;
            } else {
              parsed.hasLocalFile = false;
              currentOptions.body = JSON.stringify(parsed);
              continue;
            }
          }
          throw new Error(data.error);
        }
        if (!res.ok) {
          throw new Error(`Server error (${res.status})`);
        }

        return data;
      } catch (err: any) {
        const msg = (err?.message || "").toLowerCase();
        const isTransient = msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("server is temporarily") || msg.includes("load failed") || msg.includes("connection");
        if (isTransient && attempt < retries) {
          const delay = retryDelays[attempt] || 2000;
          attempt++;
          console.warn(`[apiFetch] Transient connection issue (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  };

  // Auto-heal when server becomes healthy or auto-dismiss after timeout
  useEffect(() => {
    if (!error) return;
    let isCancelled = false;

    // Check health immediately and periodically
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok && !isCancelled) {
          const json = await res.json();
          if (json.status === "ok") {
            const isServerIssue = error.toLowerCase().includes("server") || error.toLowerCase().includes("unavailable") || error.toLowerCase().includes("warming up") || error.toLowerCase().includes("updating") || error.toLowerCase().includes("restarting");
            if (isServerIssue) {
              console.log("[Health] Server confirmed healthy, auto-clearing temporary warning");
              setError(null);
            }
          }
        }
      } catch {
        // Still warming up
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 1200);

    // Auto-dismiss warning after 5s so user is never blocked
    const timeout = setTimeout(() => {
      if (!isCancelled && (error.toLowerCase().includes("server") || error.toLowerCase().includes("warming up") || error.toLowerCase().includes("temporarily") || error.toLowerCase().includes("restarting"))) {
        setError(null);
      }
    }, 5000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [error]);

  const handleFetchError = (err: any) => {
    console.warn("Request error:", err);
    const msg = err?.message || String(err || "");
    if (msg.includes("413") || msg.toLowerCase().includes("request entity too large") || msg.toLowerCase().includes("payload too large")) {
      setError("The file was too large for a single request. Please try uploading again.");
    } else if (msg.includes("429") || msg.toLowerCase().includes("resource_exhausted") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
      setSelectedAiModel("gemini-3.1-flash-lite");
      setError("The requested AI model is temporarily rate-limited. We've automatically switched you to the ultra-fast Gemini 3.1 Flash Lite engine. Click 'Try Again Now' to proceed immediately.");
    } else if (msg.includes("<!doctype html>") || msg.includes("DOCTYPE") || msg.includes("<html>") || msg.toLowerCase().includes("server is temporarily")) {
      setError("The server was momentarily restarting or busy. Please click 'Try Again Now' to resume.");
    } else if (msg.toLowerCase().includes("failed to fetch")) {
      setError("Network connection issue: Could not connect to the server. Please check your connection and try again.");
    } else if (msg.includes("503") || msg.toLowerCase().includes("overloaded") || msg.toLowerCase().includes("high demand")) {
      setError("The AI model is currently experiencing high demand. Please click 'Try Again Now' in a moment.");
    } else {
      setError(msg || "An unexpected error occurred");
    }
  };

  const uploadInChunks = async (
    selectedFile: File,
    chunkSize = 6 * 1024 * 1024
  ): Promise<{ fileUri: string; mimeType: string; extractedText?: string; digitalScan?: DigitalScanReport }> => {
    const totalChunks = Math.max(1, Math.ceil(selectedFile.size / chunkSize));
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const mimeType =
      selectedFile.type ||
      (selectedFile.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");

    let finalData: {
      fileUri?: string;
      mimeType?: string;
      extractedText?: string;
      digitalScan?: DigitalScanReport;
      error?: string;
    } | null = null;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(selectedFile.size, start + chunkSize);
      const chunkBlob = selectedFile.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("totalChunks", String(totalChunks));
      formData.append("mimeType", mimeType);
      formData.append("chunk", chunkBlob, selectedFile.name);

      let data: any;
      try {
        data = await apiFetchJson("/api/upload-chunk", {
          method: "POST",
          body: formData,
        });
      } catch (err: any) {
        if (err?.message?.includes("413")) {
          if (chunkSize > 2 * 1024 * 1024) {
            return uploadInChunks(selectedFile, 2 * 1024 * 1024);
          }
          throw new Error("The uploaded file exceeds the maximum allowed network size.");
        }
        throw err;
      }

      if (chunkIndex === totalChunks - 1) {
        finalData = data;
      }
    }

    if (!finalData?.fileUri) {
      throw new Error("Could not finalize file upload.");
    }

    if (finalData.extractedText) {
      extractedTextCacheRef.current.set(finalData.fileUri, finalData.extractedText);
      try {
        sessionStorage.setItem(`notivexa_doc_text_${finalData.fileUri}`, finalData.extractedText.slice(0, 80000));
      } catch {
        // Ignore storage quota
      }
    }

    return {
      fileUri: finalData.fileUri,
      mimeType: finalData.mimeType || mimeType,
      extractedText: finalData.extractedText,
      digitalScan: finalData.digitalScan,
    };
  };

  const uploadDocumentToServer = async (
    selectedFile: File
  ): Promise<{ fileUri: string; mimeType: string; extractedText?: string; digitalScan?: DigitalScanReport }> => {
    const DIRECT_UPLOAD_LIMIT = 8 * 1024 * 1024; // 8 MB threshold to stay well below Cloud Run's 32 MB limit
    if (selectedFile.size > DIRECT_UPLOAD_LIMIT) {
      return uploadInChunks(selectedFile);
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    let data: any;
    try {
      data = await apiFetchJson("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
    } catch (err: any) {
      if (err?.message?.includes("413") || err?.message?.includes("Request Entity Too Large")) {
        return uploadInChunks(selectedFile, 4 * 1024 * 1024);
      }
      throw err;
    }

    if (!data?.fileUri) {
      throw new Error(data?.error || "Failed to upload file");
    }

    if (data.extractedText) {
      extractedTextCacheRef.current.set(data.fileUri, data.extractedText);
      try {
        sessionStorage.setItem(`notivexa_doc_text_${data.fileUri}`, data.extractedText.slice(0, 80000));
      } catch {
        // Ignore storage quota
      }
    }

    return {
      fileUri: data.fileUri,
      mimeType: data.mimeType || selectedFile.type || "application/pdf",
      extractedText: data.extractedText,
      digitalScan: data.digitalScan,
    };
  };

  const scanDigitalDocument = async (
    targetFileUri?: string,
    targetMimeType?: string,
    targetFileName?: string,
    deepScan = false
  ) => {
    const uri = targetFileUri || fileData?.fileUri;
    const mime = targetMimeType || fileData?.mimeType || "application/pdf";
    const fName = targetFileName || file?.name || "Uploaded Digital Document";
    if (!uri) return;

    setIsScanningDigitalDoc(true);
    try {
      const data = await apiFetchJson("/api/scan-digital-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: uri,
          mimeType: mime,
          fileName: fName,
          deepScan,
        }),
      });
      if (data?.digitalScan) {
        setDigitalScanReport(data.digitalScan);
        const extracted = data.extractedText || data.digitalScan.textPreview || "";
        if (extracted) {
          setScannedDigitalText(extracted);
          extractedTextCacheRef.current.set(uri, extracted);
        }
        if (Array.isArray(data.digitalScan.units) && data.digitalScan.units.length > 0) {
          setDetectedUnits(data.digitalScan.units);
          if (data.digitalScan.units[0]?.unit) {
            setSelectedUnit(data.digitalScan.units[0].unit);
          }
        }
      }
    } catch (scanErr) {
      console.warn("Could not scan digital document:", scanErr);
    } finally {
      setIsScanningDigitalDoc(false);
    }
  };

  const handleUploadFile = async (selectedFile: File, uploadSource = "Quick Scan") => {
    const MAX_LIMIT = 1073741824; // 1 GB
    if (selectedFile.size > MAX_LIMIT) {
      setError("The selected file exceeds the 1 GB upload limit. Please choose a document smaller than 1 GB.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setResultText("");
    setResultType("");
    setFlashcards([]);
    setSlides([]);
    setVideoData(null);
    setLessonPlan(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setGeneratedFunctionsCache({});
    setActiveScanFocusTopic("");
    setShowDigitalScannerHub(true);

    try {
      const data = await uploadDocumentToServer(selectedFile);
      setFileData({ fileUri: data.fileUri, mimeType: data.mimeType });

      if (data.digitalScan) {
        setDigitalScanReport(data.digitalScan);
        setScannedDigitalText(data.extractedText || data.digitalScan.textPreview || "");
        if (Array.isArray(data.digitalScan.units) && data.digitalScan.units.length > 0) {
          setDetectedUnits(data.digitalScan.units);
          if (data.digitalScan.units[0]?.unit) {
            setSelectedUnit(data.digitalScan.units[0].unit);
          }
        }
      } else {
        void scanDigitalDocument(data.fileUri, data.mimeType, selectedFile.name, false);
      }

      await saveUploadedDocumentToVault(userStorageKey, {
        id: `doc:${data.fileUri}`,
        fileName: selectedFile.name,
        mimeType: data.mimeType || selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        fileUri: data.fileUri,
        uploadSource,
        extractedText: data.extractedText || data.digitalScan?.textPreview || "",
        digitalScan: data.digitalScan || null,
        detectedUnits: data.digitalScan?.units || [],
        fileBlob: selectedFile,
      });
      setStorageRefreshTick((t) => t + 1);

      // Immediately render the uploaded document same-to-same in the interface so the user can view and fast-download the exact pages right away
      const isTabularUpload = /\.(xlsx|xls|csv|tsv)$/i.test(selectedFile.name);
      await convertDocumentSameToSameHandwriting(
        data.fileUri,
        data.mimeType,
        selectedFile.name,
        data.extractedText || data.digitalScan?.textPreview || "",
        isTabularUpload
      );

      if (user) {
        try {
          await addDoc(collection(db, "users", user.uid, "books"), {
            title: selectedFile.name,
            author: "Uploaded File",
            desc: `Uploaded via ${uploadSource}`,
            department: "General",
            fileUri: data.fileUri,
            mimeType: data.mimeType,
            link: "",
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.warn("Failed to save to history:", dbErr);
        }
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (selectedFile) await handleUploadFile(selectedFile, "Digital File Upload System");
  };

  const getDigitalFileFormatBadge = (fileNameOrMime?: string) => {
    const lower = (fileNameOrMime || "").toLowerCase();
    if (lower.endsWith(".pdf") || lower.includes("pdf")) return "PDF Digital File";
    if (lower.endsWith(".docx") || lower.endsWith(".doc") || lower.includes("word")) return "DOCX Word File";
    if (lower.endsWith(".pptx") || lower.endsWith(".ppt") || lower.includes("presentation")) return "PPTX Slide File";
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv") || lower.endsWith(".tsv")) return "XLSX / CSV Data File";
    if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "Markdown (.MD) File";
    if (lower.endsWith(".txt") || lower.endsWith(".rtf")) return "Digital Text (.TXT) File";
    if (lower.endsWith(".json") || lower.endsWith(".xml") || lower.endsWith(".html") || lower.endsWith(".htm")) return "Structured Digital File";
    if (/\.(png|jpe?g|webp|bmp)$/i.test(lower) || lower.startsWith("image/")) return "Optical Image Scan";
    return "Digital Document File";
  };

  const formatDigitalFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "Digital Stream";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const SAMPLE_DIGITAL_DOCUMENTS: Array<{
    id: string;
    title: string;
    fileName: string;
    format: ".md" | ".txt" | ".csv";
    badge: string;
    content: string;
  }> = [
    {
      id: "sample-os-distributed",
      title: "Operating Systems & Distributed Architecture",
      fileName: "Operating_Systems_Distributed_Architecture_Digital_Doc.md",
      format: ".md",
      badge: "MD Digital Textbook",
      content: `# Operating Systems & Distributed Computing Architecture

## Unit 1: Process Management, Threads & CPU Scheduling
A process is an active program in execution containing a Process Control Block (PCB), program counter, CPU registers, stack, and heap memory segments.
- **Process States**: New, Ready, Running, Waiting (Blocked), and Terminated.
- **Context Switching**: Saving the state of the active process into its PCB and loading the saved state of the next scheduled process.
- **CPU Scheduling Algorithms**:
  1. First-Come, First-Served (FCFS) — Non-preemptive queue scheduling.
  2. Shortest Job First (SJF) & Shortest Remaining Time First (SRTF) — Optimal minimum average waiting time: $W_{avg} = \\frac{1}{N}\\sum (T_{turnaround} - T_{burst})$.
  3. Round Robin (RR) — Time-quantum $q$ preemptive scheduling for interactive time-sharing systems.
  4. Multilevel Feedback Queue (MLFQ) — Dynamic priority adjustment preventing starvation via aging.

## Unit 2: Process Synchronization & Deadlock Handling
Concurrent processes accessing shared critical sections require atomic synchronization primitives to prevent race conditions.
- **Critical Section Problem Requirements**: Mutual Exclusion, Progress, and Bounded Waiting.
- **Semaphores & Mutex Locks**: Binary and Counting Semaphores using atomic \`wait(S)\` and \`signal(S)\` operations.
- **Necessary Conditions for Deadlock (Coffman Conditions)**:
  1. Mutual Exclusion
  2. Hold and Wait
  3. No Preemption
  4. Circular Wait
- **Deadlock Avoidance**: Dijkstra's Banker's Algorithm evaluates safe state sequences using Available, Max, Allocation, and Need matrices ($Need[i,j] = Max[i,j] - Allocation[i,j]$).

## Unit 3: Virtual Memory, Paging & Storage Hierarchy
Virtual memory decouples logical address spaces from physical RAM frames using Demand Paging and Translation Lookaside Buffers (TLB).
- **Effective Access Time (EAT)**: $EAT = \\alpha(T_{TLB} + T_{mem}) + (1 - \\alpha)(T_{TLB} + 2T_{mem})$, where $\\alpha$ is the TLB hit ratio.
- **Page Replacement Algorithms**: FIFO (Belady's Anomaly), Optimal (OPT), and Least Recently Used (LRU).
- **Thrashing & Working Set Model**: Occurs when a process spends more time paging than executing instructions ($\\Delta$ working-set window).

## Unit 4: Distributed Systems, Consensus & Fault Tolerance
Distributed systems coordinate autonomous nodes communicating over a network without shared physical memory.
- **Logical Clocks**: Lamport Timestamps ($L(e_i) < L(e_j)$) and Vector Clocks for causal event ordering.
- **CAP Theorem**: Consistency, Availability, and Partition Tolerance trade-offs in distributed data stores.
- **Consensus Protocols**: Paxos and Raft Leader Election, Log Replication, and Quorum Commit ($Q = \\lfloor N/2 \\rfloor + 1$).`,
    },
    {
      id: "sample-ml-ai",
      title: "Machine Learning & Deep Neural Networks",
      fileName: "Machine_Learning_Neural_Networks_Digital_Syllabus.md",
      format: ".md",
      badge: "AI/ML Digital File",
      content: `# Machine Learning & Deep Neural Networks — Complete Digital Study Document

## Unit 1: Supervised Learning, Regression & Statistical Foundations
Supervised learning learns a mapping function $f_\\theta: X \\rightarrow Y$ from labeled training pairs $\\{(x^{(i)}, y^{(i)})\\}_{i=1}^m$.
- **Linear Regression Cost Function (MSE)**: $J(\\theta) = \\frac{1}{2m} \\sum_{i=1}^m (h_\\theta(x^{(i)}) - y^{(i)})^2$.
- **Gradient Descent Update Rule**: $\\theta_j := \\theta_j - \\alpha \\frac{\\partial J(\\theta)}{\\partial \\theta_j}$.
- **Logistic Regression & Cross-Entropy**: Uses Sigmoid activation $\\sigma(z) = \\frac{1}{1 + e^{-z}}$ for binary classification.
- **Bias-Variance Tradeoff**: Total Expected Error = $\\text{Bias}^2 + \\text{Variance} + \\sigma^2_{irreducible}$. Regularization via L1 (Lasso) and L2 (Ridge) penalties.

## Unit 2: Decision Trees, Ensemble Methods & Support Vector Machines
- **Information Gain & Entropy**: $H(S) = -\\sum p_i \\log_2(p_i)$ and Gini Impurity $G = 1 - \\sum p_i^2$.
- **Ensemble Learning**: Bagging (Random Forests) reduces variance; Boosting (AdaBoost, Gradient Boosted Trees, XGBoost) reduces bias sequentially.
- **Support Vector Machines (SVM)**: Maximizes geometric margin $\\gamma = \\frac{2}{\\|w\\|}$ using Lagrange multipliers and Kernel Trick (RBF, Polynomial Kernels).

## Unit 3: Deep Neural Networks, Backpropagation & CNN Architectures
- **Multilayer Perceptrons (MLP)**: Forward propagation through hidden layers with ReLU, GELU, and Softmax activations.
- **Backpropagation Algorithm**: Computes layer-wise error gradients $\\delta^{(l)} = ((W^{(l)})^T \\delta^{(l+1)}) \\odot f'(z^{(l)})$ via the Chain Rule.
- **Convolutional Neural Networks (CNNs)**: Spatial feature extraction using Convolution kernels, Stride, Padding, Pooling layers, and Residual Connections (ResNet).

## Unit 4: Sequence Models, Attention Mechanism & Transformers
- **Self-Attention Equation**: $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$.
- **Multi-Head Attention & Positional Encoding**: Enables parallel context modeling across long token sequences in Transformer architectures.`,
    },
    {
      id: "sample-dbms",
      title: "Database Management Systems (DBMS & SQL)",
      fileName: "DBMS_Normalization_Transactions_Digital_Notes.txt",
      format: ".txt",
      badge: "TXT Digital Notes",
      content: `# Database Management Systems (DBMS) — Digital Lecture File

## Unit 1: Relational Model, ER Diagrams & Relational Algebra
- Entity-Relationship (ER) Modeling: Entities, Attributes, Cardinality Ratios (1:1, 1:N, M:N), and Weak Entity Sets.
- Relational Algebra Operators: Selection (σ), Projection (π), Cartesian Product (×), Natural Join (⋈), Division (÷).

## Unit 2: Functional Dependencies & Database Normalization
- Armstrong's Axioms: Reflexivity, Augmentation, and Transitivity.
- Normal Forms Hierarchy:
  1. First Normal Form (1NF): Atomic attribute domains, no repeating groups.
  2. Second Normal Form (2NF): 1NF + No partial functional dependencies on candidate keys.
  3. Third Normal Form (3NF): 2NF + No transitive dependencies (X -> Y where Y is non-prime).
  4. Boyce-Codd Normal Form (BCNF): For every non-trivial dependency X -> Y, X must be a superkey.
- Lossless-Join and Dependency-Preserving Decomposition.

## Unit 3: Transaction Processing, ACID Properties & Concurrency Control
- ACID Properties: Atomicity, Consistency, Isolation, Durability.
- Serializability: Conflict Serializability (Precedence Graph cycle test) and View Serializability.
- Two-Phase Locking (2PL): Growing Phase and Shrinking Phase; Strict 2PL prevents cascading rollbacks.
- Timestamp Ordering & Validation-Based Concurrency Protocols.

## Unit 4: Indexing, B+ Trees & Crash Recovery (ARIES)
- B+ Tree Indexing: Balanced multi-level index with O(log_b N) search, insertion, and deletion; linked leaf nodes for range queries.
- ARIES Recovery Algorithm: Write-Ahead Logging (WAL), Analysis, Redo, and Undo phases with Fuzzy Checkpointing.`,
    },
  ];

  const handleUploadDirectDigitalDoc = async (
    titleInput: string,
    contentInput: string,
    formatInput: ".md" | ".txt" | ".csv" | ".json" = ".md"
  ) => {
    const cleanContent = contentInput.trim();
    if (cleanContent.length < 20) {
      setError("Please enter or paste at least 20 characters of digital document text.");
      return;
    }

    const safeTitle = (titleInput.trim() || "Digital_Study_Document").replace(/\.[^/.]+$/, "");
    const fileName = `${safeTitle}${formatInput}`;
    const mimeType =
      formatInput === ".csv"
        ? "text/csv"
        : formatInput === ".json"
        ? "application/json"
        : formatInput === ".md"
        ? "text/markdown"
        : "text/plain";

    const syntheticFile = new File([cleanContent], fileName, { type: mimeType });
    setFile(syntheticFile);
    setLoading(true);
    setError(null);
    setResultText("");
    setResultType("");
    setFlashcards([]);
    setSlides([]);
    setVideoData(null);
    setLessonPlan(null);
    setGeneratedFunctionsCache({});
    setActiveScanFocusTopic("");
    setShowDigitalScannerHub(true);
    setShowCreateDigitalDocModal(false);

    try {
      const data = await apiFetchJson("/api/upload-digital-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: safeTitle,
          content: cleanContent,
          format: formatInput,
        }),
      });

      setFileData({ fileUri: data.fileUri, mimeType: data.mimeType || mimeType });
      if (data.extractedText) {
        extractedTextCacheRef.current.set(data.fileUri, data.extractedText);
        setScannedDigitalText(data.extractedText);
      }
      if (data.digitalScan) {
        setDigitalScanReport(data.digitalScan);
        if (Array.isArray(data.digitalScan.units) && data.digitalScan.units.length > 0) {
          setDetectedUnits(data.digitalScan.units);
          if (data.digitalScan.units[0]?.unit) {
            setSelectedUnit(data.digitalScan.units[0].unit);
          }
        }
      }

      await saveUploadedDocumentToVault(userStorageKey, {
        id: `doc:${data.fileUri}`,
        fileName,
        mimeType: data.mimeType || mimeType,
        fileSize: syntheticFile.size,
        fileUri: data.fileUri,
        uploadSource: "Direct Digital Document Studio",
        extractedText: data.extractedText || cleanContent,
        digitalScan: data.digitalScan || null,
        detectedUnits: data.digitalScan?.units || [],
        fileBlob: syntheticFile,
      });

      await convertDocumentSameToSameHandwriting(
        data.fileUri,
        data.mimeType || mimeType,
        fileName,
        data.extractedText || cleanContent,
        formatInput === ".csv"
      );
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadActiveDigitalDocumentFile = () => {
    if (file && file.size > 0) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || "Digital_Document.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const textToSave = scannedDigitalText || digitalScanReport?.textPreview || resultText || "";
    if (!textToSave) return;
    const blob = new Blob([textToSave], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = (digitalScanReport?.documentTitle || file?.name || "Scanned_Digital_Document").replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `${baseName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDriveUpload = async () => {
    if (!drivePickerReady || loading || isPickingDrive) return;
    setIsPickingDrive(true);
    setError(null);
    try {
      const accessToken = await requestGoogleDriveAccessToken();
      const selectedFile = await pickBookFromGoogleDrive(accessToken);
      if (selectedFile) await handleUploadFile(selectedFile, "Google Drive");
    } catch (driveError) {
      handleFetchError(driveError);
    } finally {
      setIsPickingDrive(false);
    }
  };

  const detectChaptersFromDoc = async () => {
    if (!fileData) return;
    setIsDetectingChapters(true);
    try {
      const data = await apiFetchJson("/api/detect-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType }),
      });
      if (data && Array.isArray(data.units) && data.units.length > 0) {
        setDetectedUnits(data.units);
        if (data.units[0]?.unit) {
          setSelectedUnit(data.units[0].unit);
        }
      }
    } catch (e) {
      console.warn("Could not auto-detect units/chapters:", e);
    } finally {
      setIsDetectingChapters(false);
    }
  };

  const generateNotes = async (unitOverride?: string, chapterOverride?: string) => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("notes");
    setError(null);
    try {
      const unitVal = unitOverride !== undefined ? unitOverride : selectedUnit;
      const chapterVal = chapterOverride !== undefined ? chapterOverride : selectedChapter;
      const finalUnit = unitVal === "custom" ? (customUnitTitle.trim() || "Custom Unit") : unitVal;
      const finalChapter = chapterVal === "custom" ? (customChapterTitle.trim() || "Custom Chapter") : chapterVal;
      const chapterTitleVal = customChapterTitle.trim() || (chapterVal !== "all" && chapterVal !== "custom" ? chapterVal : "");
      const isSpecificSelection = finalUnit !== "all" || finalChapter !== "all" || Boolean(customChapterTitle.trim());

      // Client-side cache check
      if (!isSpecificSelection) {
        const cached = history.find(
          (item) => item.fileUri === fileData.fileUri && item.type === "notes" && item.notesVersion === 5);
        if (cached) {
          setGeneratedResultText(cached.resultText || "");
          setResultType("notes");
          setFlashcards([]);
          if (cached.focusArea) {
            setFocusArea(cached.focusArea);
          }
          setLoading(false);
          setGeneratingType("");
          return;
        }
      }

      lastActionRef.current = () => generateNotes(unitOverride, chapterOverride);
      const data = await apiFetchJson("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          focusArea: focusArea,
          mode: mode,
          model: selectedAiModel,
          unit: finalUnit,
          chapter: finalChapter,
          chapterTitle: chapterTitleVal,
          targetPages: noteDepthTarget,
          scopeStyle: chapterScopeStyle,
        }),
      });

      const generatedNotes = normalizeGeneratedContent(data.result || "");
      setGeneratedResultText(generatedNotes);
      setResultType("notes");
      setFlashcards([]);
      setShowDigitalScannerHub(false);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        notes: { label: "Handwritten Notes", resultText: generatedNotes, resultType: "notes" },
      }));

      const noteTitle = isSpecificSelection
        ? `${file ? file.name : "Study Notes"} - ${finalUnit !== "all" ? finalUnit : ""} ${finalChapter !== "all" ? finalChapter : ""}`.trim()
        : (file ? file.name : "Study Notes");

      await persistStudyOutputToUserVault({
        title: noteTitle,
        type: "notes",
        notesVersion: data.notesVersion ?? 5,
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: generatedNotes,
        flashcards: [],
        focusArea: focusArea,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: noteTitle,
          type: "notes",
          notesVersion: data.notesVersion ?? 5,
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: generatedNotes,
          flashcards: [],
          focusArea: focusArea,
          createdAt: serverTimestamp()
        });
      }

    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }

  };

  const generateHandwritingNotes = async () => {
    return generateNotes();
  };

  const generateAssessment = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("assessment");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "assessment");
      if (cached) {
        setGeneratedResultText(cached.resultText || "");
        setResultType("assessment");
                setFlashcards([]);
        setLoading(false);
        setGeneratingType("");
        return;
      }


      lastActionRef.current = () => generateAssessment();
      const data = await apiFetchJson("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, difficulty: "Medium", mode: mode, model: selectedAiModel }),
      });
      
      const generatedAssessment = normalizeGeneratedContent(data.result || "");
      setGeneratedResultText(generatedAssessment);
      setResultType("assessment");
            setFlashcards([]);

      await persistStudyOutputToUserVault({
        title: file ? file.name : "Assessment Paper",
        type: "assessment",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: generatedAssessment,
        flashcards: [],
        focusArea: focusArea,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Assessment Paper",
          type: "assessment",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: generatedAssessment,

          flashcards: [],
          focusArea: focusArea,
          createdAt: serverTimestamp()
        });
      }

    }
 catch (err: any) {
      handleFetchError(err);
    }
 finally {
      setLoading(false);
      setGeneratingType("");
    }

  };

  const generateQuestionBank = async (typeOverride?: string) => {
    if (!fileData) return;
    const activeQuestionType = typeOverride || questionBankType;
    if (typeOverride && typeOverride !== questionBankType) {
      setQuestionBankType(typeOverride as any);
    }
    setLoading(true);
    setGeneratingType(activeQuestionType === "short" ? "short-questions" : "question-bank");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) =>
          item.fileUri === fileData.fileUri &&
          item.type === "question-bank" &&
          item.questionBankType === activeQuestionType &&
          item.questionBankBloomLevel === questionBankBloomLevel &&
          (item as any).qbVersion === 3
      );
      if (cached) {
        setGeneratedResultText(cached.resultText || "");
        setResultType("question-bank");
        setFlashcards([]);
        setShowDigitalScannerHub(false);
        const cacheKey = activeQuestionType === "short" ? "short-questions" : "question-bank";
        setGeneratedFunctionsCache((prev) => ({
          ...prev,
          [cacheKey]: {
            label: activeQuestionType === "short" ? "5M Short Questions (2 Pages)" : "Question Bank",
            resultText: cached.resultText || "",
            resultType: "question-bank",
          },
        }));
        setLoading(false);
        setGeneratingType("");
        return;
      }

      lastActionRef.current = () => generateQuestionBank(activeQuestionType);
      const data = await apiFetchJson("/api/generate-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          questionType: activeQuestionType,
          bloomLevel: questionBankBloomLevel,
          mode: mode,
          model: selectedAiModel,
        }),
      });

      const generatedQuestionBank = normalizeGeneratedContent(data.result || "");
      setGeneratedResultText(generatedQuestionBank);
      setResultType("question-bank");
      setFlashcards([]);
      setShowDigitalScannerHub(false);
      const cacheKey = activeQuestionType === "short" ? "short-questions" : "question-bank";
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        [cacheKey]: {
          label: activeQuestionType === "short" ? "5M Short Questions (2 Pages)" : "Question Bank",
          resultText: generatedQuestionBank,
          resultType: "question-bank",
        },
      }));

      await persistStudyOutputToUserVault({
        title: file ? file.name : "Question Bank",
        type: "question-bank",
        questionBankType: activeQuestionType,
        questionBankBloomLevel: questionBankBloomLevel,
        qbVersion: 3,
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: generatedQuestionBank,
        flashcards: [],
        focusArea: focusArea,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Question Bank",
          type: "question-bank",
          questionBankType: activeQuestionType,
          questionBankBloomLevel: questionBankBloomLevel,
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: generatedQuestionBank,
          qbVersion: 3,
          flashcards: [],
          focusArea: focusArea,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };



  const downloadCSV = () => {
    if (flashcards.length === 0) return;
    
    const csvRows = [];
    for (const card of flashcards) {
      const term = `"${card.term.replace(/"/g, '""')}"`;
      const definition = `"${card.definition.replace(/"/g, '""')}"`;
      csvRows.push(`${term},${definition}`);
    }

    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateLessonPlan = async (config?: LessonPlanConfig) => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("lesson-plan");
    setError(null);
    setShowLessonPlanGuidanceModal(false);
    try {
      const activeFocus = config?.focusArea !== undefined ? config.focusArea : focusArea;

      lastActionRef.current = () => generateLessonPlan(config);
      const data = await apiFetchJson("/api/generate-lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileUri: fileData.fileUri, 
          mimeType: fileData.mimeType, 
          focusArea: activeFocus,
          role: mode,
          model: selectedAiModel,
          studyPace: config?.studyPace || "4-week-standard",
          dailyHours: config?.dailyHours || "2 hours/day",
          studyGoal: config?.studyGoal || "Comprehensive Academic Mastery & Exam Success",
          targetAudience: config?.targetAudience || "both",
          guidanceNotes: config?.guidanceNotes
        }),
      });
      
      const plan = data.lessonPlan;
      const generatedLessonPlan = normalizeGeneratedContent(plan.fullMarkdownPlan || "");
      const normalizedPlan = {
        ...plan,
        fullMarkdownPlan: generatedLessonPlan,
      };
      setLessonPlan(normalizedPlan);
      setGeneratedResultText(generatedLessonPlan);
      setResultType("lesson-plan");
      setFlashcards([]);
      setShowDigitalScannerHub(false);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        "lesson-plan": {
          label: "Digital Lesson Plan",
          resultText: generatedLessonPlan,
          resultType: "lesson-plan",
          lessonPlan: normalizedPlan,
        },
      }));

      await persistStudyOutputToUserVault({
        title: plan.title || (file ? file.name : "Study Lesson Plan"),
        type: "lesson-plan",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: generatedLessonPlan,
        flashcards: [],
        lessonPlan: normalizedPlan,
        focusArea: activeFocus,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: plan.title || (file ? file.name : "Study Lesson Plan"),
          type: "lesson-plan",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: generatedLessonPlan,
          flashcards: [],
          lessonPlan: normalizedPlan,
          focusArea: activeFocus,
          createdAt: serverTimestamp()
        });
      }

    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };

  const generateFlashcards = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("flashcards");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "flashcards");
      if (cached) {
        setGeneratedFlashcards(cached.flashcards || []);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setResultText("");
        setShowDigitalScannerHub(false);
        setGeneratedFunctionsCache((prev) => ({
          ...prev,
          flashcards: { label: "Pastel Flashcards", flashcards: cached.flashcards || [] },
        }));
        setLoading(false);
        setGeneratingType("");
        return;
      }

      lastActionRef.current = () => generateFlashcards();
      const data = await apiFetchJson("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, mode: mode, model: selectedAiModel }),
      });
      
      const generatedFlashcards = normalizeGeneratedFlashcards(data.flashcards || []);
      setGeneratedFlashcards(generatedFlashcards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setResultText("");
      setShowDigitalScannerHub(false);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        flashcards: { label: "Pastel Flashcards", flashcards: generatedFlashcards },
      }));
      
      await persistStudyOutputToUserVault({
        title: file ? file.name : "Flashcard Set",
        type: "flashcards",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: "",
        flashcards: generatedFlashcards,
        focusArea: focusArea,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Flashcard Set",
          type: "flashcards",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: "",

          flashcards: generatedFlashcards,
          focusArea: focusArea,
          createdAt: serverTimestamp()
        });
      }

    }
 catch (err: any) {
      handleFetchError(err);
    }
 finally {
      setLoading(false);
      setGeneratingType("");
    }

  };

  const generateDocFunction = async (
    functionType:
      | "executive-summary"
      | "formula-sheet"
      | "glossary"
      | "viva-qa"
      | "mindmap-atlas"
      | "cheat-sheet"
  ) => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType(functionType);
    setError(null);
    try {
      const activeFocus = activeScanFocusTopic || focusArea;
      const cached = generatedFunctionsCache[functionType];
      if (cached && cached.resultText && !activeScanFocusTopic) {
        setGeneratedResultText(cached.resultText);
        setResultType(functionType);
        setActiveMultiFunctionTitle(cached.label);
        setFlashcards([]);
        setShowDigitalScannerHub(false);
        setLoading(false);
        setGeneratingType("");
        return;
      }

      lastActionRef.current = () => generateDocFunction(functionType);
      const data = await apiFetchJson("/api/generate-doc-function", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          functionType,
          focusArea: activeFocus,
          mode,
          model: selectedAiModel,
        }),
      });

      const generatedContent = normalizeGeneratedContent(data.result || "");
      const titleLabel = data.title || "Document Analysis";
      setGeneratedResultText(generatedContent);
      setResultType(functionType);
      setActiveMultiFunctionTitle(titleLabel);
      setFlashcards([]);
      setShowDigitalScannerHub(false);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        [functionType]: {
          label: titleLabel,
          resultText: generatedContent,
          resultType: functionType,
        },
      }));

      await persistStudyOutputToUserVault({
        title: `${file ? file.name : "Document"} - ${titleLabel}`,
        type: functionType,
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: generatedContent,
        flashcards: [],
        focusArea: activeFocus,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: `${file ? file.name : "Document"} - ${titleLabel}`,
          type: functionType,
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: generatedContent,
          flashcards: [],
          focusArea: activeFocus,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };

  const convertDocumentSameToSameHandwriting = async (
    overrideFileUri?: string,
    overrideMimeType?: string,
    overrideFileName?: string,
    overrideExtractedText?: string,
    tableMode = false,
    tableData?: StructuredTablePayload
  ) => {
    const activeUri = overrideFileUri || fileData?.fileUri;
    const activeMime = overrideMimeType || fileData?.mimeType || "application/pdf";
    const activeName =
      tableData?.title ||
      overrideFileName ||
      file?.name ||
      digitalScanReport?.documentTitle ||
      "Uploaded_Document";

    if (!activeUri && !tableData) {
      setShowTableUploadModal(true);
      return;
    }

    const cacheKey = tableMode || tableData ? "handwritten-table-form" : "verbatim-handwriting";
    setLoading(true);
    setGeneratingType(cacheKey);
    setError(null);
    setIsVerbatimTableMode(Boolean(tableMode || tableData));
    // Ensure student mode is active so realistic student handwriting sheet styling is applied
    if (mode !== "student") {
      setMode("student");
    }

    try {
      const cached = generatedFunctionsCache[cacheKey];
      if (cached && cached.resultText && !overrideFileUri && !tableData) {
        setResultText(cached.resultText);
        setResultType("verbatim-handwriting");
        setActiveMultiFunctionTitle(cached.label);
        setFlashcards([]);
        setShowDigitalScannerHub(false);
        setLoading(false);
        setGeneratingType("");
        return;
      }

      const clientText =
        overrideExtractedText ||
        scannedDigitalText ||
        (activeUri ? extractedTextCacheRef.current.get(activeUri) : "") ||
        digitalScanReport?.textPreview ||
        "";

      lastActionRef.current = () =>
        convertDocumentSameToSameHandwriting(
          activeUri,
          activeMime,
          activeName,
          clientText,
          tableMode,
          tableData
        );

      const data = await apiFetchJson("/api/convert-verbatim-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: activeUri,
          mimeType: activeMime,
          fileName: activeName,
          clientExtractedText: clientText,
          tableMode: Boolean(tableMode || tableData),
          tableData,
        }),
      });

      const verbatimPages = data.result || clientText;
      const titleLabel =
        data.title ||
        (tableMode || tableData
          ? `${activeName.replace(/\.[^/.]+$/, "")} — Handwritten Table Form (1:1)`
          : `${activeName.replace(/\.[^/.]+$/, "")} — Exact Same-to-Same Handwritten Pages`);

      if (data.fileUri && !fileData) {
        setFileData({ fileUri: data.fileUri, mimeType: "text/markdown" });
      }

      setResultText(verbatimPages);
      setResultType("verbatim-handwriting");
      setActiveMultiFunctionTitle(titleLabel);
      setFlashcards([]);
      setShowDigitalScannerHub(false);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        [cacheKey]: {
          label: tableMode || tableData ? "Handwritten Table Form (1:1)" : "Same-to-Same Handwritten Pages (1:1)",
          resultText: verbatimPages,
          resultType: "verbatim-handwriting",
        },
      }));

      await persistStudyOutputToUserVault({
        title: titleLabel,
        type: "verbatim-handwriting",
        fileUri: activeUri || data.fileUri || "",
        mimeType: activeMime,
        resultText: verbatimPages,
        flashcards: [],
        focusArea: tableMode || tableData ? "Handwritten Table Form (1:1)" : "Exact Same-to-Same Verbatim Document",
      });

      if (user) {
        try {
          await addDoc(collection(db, "users", user.uid, "documents"), {
            title: titleLabel,
            type: "verbatim-handwriting",
            fileUri: activeUri || data.fileUri || "",
            mimeType: activeMime,
            resultText: verbatimPages,
            flashcards: [],
            focusArea: tableMode || tableData ? "Handwritten Table Form (1:1)" : "Exact Same-to-Same Verbatim Document",
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn("Could not save verbatim handwriting document to history:", dbErr);
        }
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };

  const handleUploadFileAndConvertHandwriting = async (selectedFile: File, tableMode = false) => {
    const MAX_LIMIT = 1073741824; // 1 GB
    if (selectedFile.size > MAX_LIMIT) {
      setError("The selected file exceeds the 1 GB upload limit. Please choose a document smaller than 1 GB.");
      return;
    }

    const isTabularFile = /\.(xlsx|xls|csv|tsv)$/i.test(selectedFile.name);
    const useTableMode = tableMode || isTabularFile;

    setFile(selectedFile);
    setLoading(true);
    setGeneratingType(useTableMode ? "handwritten-table-form" : "verbatim-handwriting");
    setError(null);
    setResultText("");
    setResultType("");
    setFlashcards([]);
    setSlides([]);
    setVideoData(null);
    setLessonPlan(null);
    setGeneratedFunctionsCache({});
    if (mode !== "student") {
      setMode("student");
    }

    try {
      const uploaded = await uploadDocumentToServer(selectedFile);
      setFileData({ fileUri: uploaded.fileUri, mimeType: uploaded.mimeType });
      if (uploaded.digitalScan) {
        setDigitalScanReport(uploaded.digitalScan);
        setScannedDigitalText(uploaded.extractedText || uploaded.digitalScan.textPreview || "");
        if (Array.isArray(uploaded.digitalScan.units) && uploaded.digitalScan.units.length > 0) {
          setDetectedUnits(uploaded.digitalScan.units);
        }
      }
      await saveUploadedDocumentToVault(userStorageKey, {
        id: `doc:${uploaded.fileUri}`,
        fileName: selectedFile.name,
        mimeType: uploaded.mimeType || selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        fileUri: uploaded.fileUri,
        uploadSource: useTableMode ? "Table Form Upload" : "Verbatim Handwriting Upload",
        extractedText: uploaded.extractedText || uploaded.digitalScan?.textPreview || "",
        digitalScan: uploaded.digitalScan || null,
        detectedUnits: uploaded.digitalScan?.units || [],
        fileBlob: selectedFile,
      });
      await convertDocumentSameToSameHandwriting(
        uploaded.fileUri,
        uploaded.mimeType,
        selectedFile.name,
        uploaded.extractedText || uploaded.digitalScan?.textPreview || "",
        useTableMode
      );
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };

  const handleUploadAndConvertVerbatim = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!selectedFile) return;
    await handleUploadFileAndConvertHandwriting(selectedFile, false);
  };

  const handleUploadAndConvertTable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!selectedFile) return;
    await handleUploadFileAndConvertHandwriting(selectedFile, true);
  };

  const handleTriggerMultiFunction = async (funcId: DocMultiFunctionId) => {
    if (!fileData) {
      if (funcId === "handwritten-table-form") {
        setShowTableUploadModal(true);
        return;
      }
      setError("Please upload or scan a digital document first.");
      return;
    }

    if (activeScanFocusTopic) {
      setFocusArea(activeScanFocusTopic);
    }

    switch (funcId) {
      case "verbatim-handwriting":
        await convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, false);
        break;
      case "handwritten-table-form":
        await convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, true);
        break;
      case "notes":
        await generateNotes();
        break;
      case "short-questions":
        await generateQuestionBank("short");
        break;
      case "question-bank":
        await generateQuestionBank("all");
        break;
      case "exam-paper":
        await generateExamPaper();
        break;
      case "flashcards":
        await generateFlashcards();
        break;
      case "lesson-plan":
        setShowLessonPlanGuidanceModal(true);
        break;
      case "ppt":
        openPPTTopicStudio();
        break;
      case "video":
        await generateVideoExplanation();
        break;
      case "easyocr":
        await runEasyOCR(file || undefined);
        break;
      case "executive-summary":
      case "formula-sheet":
      case "glossary":
      case "viva-qa":
      case "mindmap-atlas":
      case "cheat-sheet":
        await generateDocFunction(funcId);
        break;
      default:
        await generateNotes();
    }
  };

  const handleBatchGenerateStudyPack = async () => {
    if (!fileData || isBatchGenerating) return;
    setIsBatchGenerating(true);
    setError(null);
    const activeFocus = activeScanFocusTopic || focusArea;

    try {
      // 1. Executive Summary
      setBatchProgressLabel("Step 1/4: Generating Executive Summary...");
      const summaryData = await apiFetchJson("/api/generate-doc-function", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          functionType: "executive-summary",
          focusArea: activeFocus,
          mode,
          model: selectedAiModel,
        }),
      });
      const summaryText = normalizeGeneratedContent(summaryData.result || "");
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        "executive-summary": {
          label: "Executive Summary & Digest",
          resultText: summaryText,
          resultType: "executive-summary",
        },
      }));

      // 2. 5-Mark Short Questions (2 A4 Pages + Diagrams)
      setBatchProgressLabel("Step 2/4: Generating 5M Short Q&A (2 A4 Pages)...");
      const shortQData = await apiFetchJson("/api/generate-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          questionType: "short",
          bloomLevel: questionBankBloomLevel,
          mode,
          model: selectedAiModel,
        }),
      });
      const shortQText = normalizeGeneratedContent(shortQData.result || "");
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        "short-questions": {
          label: "5M Short Questions (2 Pages)",
          resultText: shortQText,
          resultType: "question-bank",
        },
      }));

      // 3. Cheat Sheet
      setBatchProgressLabel("Step 3/4: Generating Exam Cheat Sheet...");
      const cheatData = await apiFetchJson("/api/generate-doc-function", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          functionType: "cheat-sheet",
          focusArea: activeFocus,
          mode,
          model: selectedAiModel,
        }),
      });
      const cheatText = normalizeGeneratedContent(cheatData.result || "");
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        "cheat-sheet": {
          label: "High-Yield Exam Cheat Sheet",
          resultText: cheatText,
          resultType: "cheat-sheet",
        },
      }));

      // 4. Solid Pastel Flashcards
      setBatchProgressLabel("Step 4/4: Generating Solid Pastel Flashcards...");
      const cardsData = await apiFetchJson("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          mode,
          model: selectedAiModel,
        }),
      });
      const cardsList = normalizeGeneratedFlashcards(cardsData.flashcards || []);
      setGeneratedFlashcards(cardsList);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        flashcards: {
          label: "Pastel Flashcards",
          flashcards: cardsList,
        },
      }));

      await persistStudyOutputToUserVault({
        title: `${file ? file.name : "Document"} - Executive Summary & Digest`,
        type: "executive-summary",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: summaryText,
        flashcards: [],
        focusArea: activeFocus,
      });
      await persistStudyOutputToUserVault({
        title: `${file ? file.name : "Document"} - 5M Short Questions`,
        type: "question-bank",
        questionBankType: "short",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: shortQText,
        flashcards: [],
        focusArea: activeFocus,
      });
      await persistStudyOutputToUserVault({
        title: `${file ? file.name : "Document"} - High-Yield Exam Cheat Sheet`,
        type: "cheat-sheet",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: cheatText,
        flashcards: [],
        focusArea: activeFocus,
      });
      await persistStudyOutputToUserVault({
        title: `${file ? file.name : "Document"} - Pastel Flashcards`,
        type: "flashcards",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: "",
        flashcards: cardsList,
        focusArea: activeFocus,
      });

      // Display the 5-Mark Short Questions first so user can switch across all 4 functions in 1 click
      setGeneratedResultText(shortQText);
      setResultType("question-bank");
      setActiveMultiFunctionTitle("5M Short Questions (2 Pages)");
      setShowDigitalScannerHub(false);
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setIsBatchGenerating(false);
      setBatchProgressLabel("");
    }
  };




  const downloadPPT = async () => {
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      const pres = new pptxgen();

      // Define master slide layout based on theme
      let bgColor = "FDFBF7"; // Academic
      let accentColor = "E11D48";
      let fontName = "Times New Roman";
      let titleColor = "0F172A";
      let contentColor = "334155";
      
      if (pptTheme === "professional") {
        bgColor = "FFFFFF";
        accentColor = "2563EB"; // Blue
        fontName = "Arial";
        titleColor = "1E293B";
        contentColor = "475569";
      } else if (pptTheme === "minimalist") {
        bgColor = "F8FAFC";
        accentColor = "000000";
        fontName = "Helvetica";
        titleColor = "000000";
        contentColor = "000000";
      } else if (pptTheme === "pastel") {
        bgColor = "FEF2F2"; // Soft rose
        accentColor = "FBCFE8"; // Soft pink
        fontName = "Helvetica";
        titleColor = "831843"; // Deep pink/rose for contrast
        contentColor = "9D174D";
      }

      const objects: any[] = [];
      if (pptTheme === "academic" || pptTheme === "professional") {
        objects.push({ rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: accentColor } } });
        objects.push({ rect: { x: 0, y: "96%", w: "100%", h: 0.05, fill: { color: accentColor } } });
      }
      objects.push({ text: { text: "Notivexa AI Presentation", options: { x: 0.5, y: "96.5%", w: 3, h: 0.2, fontSize: 10, fontFace: fontName, color: "888888" } } });

      pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: bgColor },
        objects: objects,
        slideNumber: { x: "95%", y: "96.5%", color: "888888", fontFace: fontName, fontSize: 10 }
      });

      slides.forEach((slide, sIdx) => {
        const pptSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        
        // 1. Category Tag Pill
        const tagText = (slide.tag || slide.slideType || "Core Concept").toUpperCase();
        pptSlide.addText(tagText, {
          x: 0.6,
          y: 0.35,
          w: 8.8,
          h: 0.28,
          fontSize: 10,
          fontFace: fontName,
          bold: true,
          color: accentColor,
        });

        // 2. Slide Title
        pptSlide.addText(slide.title, {
          x: 0.6,
          y: 0.62,
          w: 8.8,
          h: 0.85,
          fontSize: 26,
          fontFace: fontName,
          bold: true,
          color: titleColor,
          valign: "top"
        });

        // 3. Simple & Easy-to-Learn Key Takeaway Banner
        let currentY = 1.55;
        if (slide.keyTakeaway) {
          pptSlide.addShape(pres.ShapeType.roundRect, {
            x: 0.6,
            y: currentY,
            w: 8.8,
            h: 0.48,
            fill: { color: "FEF3C7" },
            line: { color: "F59E0B", width: 1 },
            rectRadius: 0.08
          });
          pptSlide.addText([
            { text: "KEY TAKEAWAY: ", options: { bold: true, color: "B45309", fontSize: 11, fontFace: fontName } },
            { text: slide.keyTakeaway, options: { bold: false, color: "78350F", fontSize: 11, fontFace: fontName } }
          ], {
            x: 0.75,
            y: currentY + 0.02,
            w: 8.5,
            h: 0.44,
            valign: "middle"
          });
          currentY += 0.60;
        }

        // 4. Bullet Points
        const bulletsHeight = slide.example ? 2.3 : 2.9;
        if (slide.bullets && slide.bullets.length > 0) {
          pptSlide.addText(
            slide.bullets.map(b => ({ 
              text: b.replace(/\*\*/g, ""), 
              options: { bullet: true, fontSize: 16, fontFace: fontName, color: contentColor, breakLine: true } 
            })),
            {
              x: 0.6,
              y: currentY,
              w: 8.8,
              h: bulletsHeight,
              valign: "top",
              lineSpacing: 24,
              margin: [0, 0, 0, 0]
            }
          );
        }

        // 5. Real-World Analogy / Example Callout Box
        if (slide.example) {
          pptSlide.addShape(pres.ShapeType.roundRect, {
            x: 0.6,
            y: 4.65,
            w: 8.8,
            h: 0.48,
            fill: { color: "E0F2FE" },
            line: { color: "38BDF8", width: 1 },
            rectRadius: 0.08
          });
          pptSlide.addText([
            { text: "REAL-WORLD ANALOGY: ", options: { bold: true, color: "0369A1", fontSize: 10, fontFace: fontName } },
            { text: slide.example, options: { bold: false, color: "0C4A6E", fontSize: 10, fontFace: fontName } }
          ], {
            x: 0.75,
            y: 4.67,
            w: 8.5,
            h: 0.44,
            valign: "middle"
          });
        }
      });
      
      const safeTopic = (selectedPPTTopic || "Document_Study").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      pres.writeFile({ fileName: `Notivexa_${safeTopic}_Presentation.pptx` });
    } catch (error) {
      console.error("Error creating PPTX", error);
      setError("Failed to create PPTX file. Please try again.");
    }
  };

  const generateExamPaper = async (paperTypeOverride?: string | React.MouseEvent) => {
    if (!fileData) return;
    const effectivePaperType =
      typeof paperTypeOverride === "string" && paperTypeOverride.trim()
        ? paperTypeOverride.trim()
        : examPaperType;
    if (effectivePaperType !== examPaperType) {
      setExamPaperType(effectivePaperType);
    }
    setLoading(true);
    setGeneratingType("exam-paper");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "question-bank" && item.questionBankType === effectivePaperType && item.questionBankBloomLevel === questionBankBloomLevel && (item as any).qbVersion === 3);
      if (cached) {
        setGeneratedResultText(cached.resultText || "");
        setResultType("exam-paper");
        setGeneratedFlashcards([]);
        setShowDigitalScannerHub(false);
        setLoading(false);
        setGeneratingType("");
        return;
      }

      lastActionRef.current = () => generateExamPaper(effectivePaperType);
      const data = await apiFetchJson("/api/generate-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, questionType: effectivePaperType, bloomLevel: questionBankBloomLevel, mode: mode, totalMarks: effectivePaperType === "paper-university" ? universityMarks : undefined }),
      });
      
      const generatedExamPaper = normalizeGeneratedContent(data.result || "");
      setGeneratedResultText(generatedExamPaper);
      setResultType("exam-paper");
      setGeneratedFlashcards([]);
      setShowDigitalScannerHub(false);
      setGeneratedFunctionsCache((prev) => ({
        ...prev,
        "exam-paper": {
          label: "University Exam Paper",
          resultText: generatedExamPaper,
          resultType: "exam-paper",
        },
      }));

      await persistStudyOutputToUserVault({
        title: `${file ? file.name : "Exam Paper"} (${effectivePaperType})`,
        type: "exam-paper",
        questionBankType: effectivePaperType,
        questionBankBloomLevel: questionBankBloomLevel,
        qbVersion: 3,
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: generatedExamPaper,
        flashcards: [],
        focusArea: focusArea,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Question Bank",
          type: "question-bank",
          questionBankType: effectivePaperType,
          questionBankBloomLevel: questionBankBloomLevel,
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: generatedExamPaper,
          qbVersion: 3,
          flashcards: [],
          focusArea: focusArea,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };

  const handleRunUploadedBookSuggestion = async (action: UploadedBookSuggestionAction) => {
    if (!fileData) {
      setError("Please upload a book or document first.");
      return;
    }

    if (action.focusTopic !== undefined) {
      setActiveScanFocusTopic(action.focusTopic);
      setFocusArea(action.focusTopic);
    }

    switch (action.type) {
      case "questions-short":
      case "question-bank-short":
        await generateQuestionBank("short");
        break;
      case "questions-long":
      case "question-bank-long":
        await generateQuestionBank("long");
        break;
      case "questions-viva":
        await generateDocFunction("viva-qa");
        break;
      case "questions-assessment":
        await generateAssessment();
        break;
      case "question-bank-all":
        await generateQuestionBank("all");
        break;
      case "question-bank-mcq":
        await generateQuestionBank("mcq");
        break;
      case "flashcards":
        await generateFlashcards();
        break;
      case "exam-paper-full":
        await generateExamPaper("paper-full");
        break;
      case "exam-paper-university":
        await generateExamPaper("paper-university");
        break;
      case "exam-paper-mcq":
        await generateExamPaper("paper-mcq");
        break;
      case "notes":
        await generateNotes();
        break;
      case "cheat-sheet":
        await generateDocFunction("cheat-sheet");
        break;
      case "formula-sheet":
        await generateDocFunction("formula-sheet");
        break;
      case "executive-summary":
        await generateDocFunction("executive-summary");
        break;
      case "verbatim-handwriting":
        await convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, false);
        break;
      case "ppt":
        openPPTTopicStudio();
        break;
      case "video":
        await generateVideoExplanation(action.focusTopic);
        break;
      case "lesson-plan":
        setShowLessonPlanGuidanceModal(true);
        break;
      case "mindmap-atlas":
        await generateDocFunction("mindmap-atlas");
        break;
      case "batch-pack":
        await handleBatchGenerateStudyPack();
        break;
      default:
        await generateQuestionBank("all");
    }
  };

  useEffect(() => {
    if (fileData && pendingBookSuggestionRef.current) {
      const pending = pendingBookSuggestionRef.current;
      pendingBookSuggestionRef.current = null;
      void handleRunUploadedBookSuggestion(pending);
    }
  }, [fileData]);

  const openPPTTopicStudio = () => {
    if (!fileData) {
      setError("Please upload or choose a digital document first to generate presentations based on its topics.");
      navigateToSection("materials");
      return;
    }
    setShowPPTStudioModal(true);
  };

  const handleGenerateFromStudio = async ({ topic, slideCount, learningLevel }: { topic: string; slideCount: number; learningLevel: string }) => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("ppt");
    setError(null);
    setSelectedPPTTopic(topic);

    try {
      // Check cache for this specific topic and file
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "ppt" && (item.focusArea === topic || (!item.focusArea && topic === "Complete Document Overview"))
      );
      if (cached && cached.slides && cached.slides.length > 0) {
        setSlides(cached.slides);
        setResultType("ppt");
        setShowPPTStudioModal(false);
        setLoading(false);
        setGeneratingType("");
        return;
      }

      lastActionRef.current = () => handleGenerateFromStudio({ topic, slideCount, learningLevel });
      const data = await apiFetchJson("/api/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          topic: topic,
          focusArea: topic,
          slideCount: slideCount || 10,
          learningLevel: learningLevel || "simple",
          model: selectedAiModel,
        }),
      });
      if (data.ppt && data.ppt.slides && data.ppt.slides.length > 0) {
        setSlides(data.ppt.slides);
        setResultType("ppt");
        setShowPPTStudioModal(false);

        await persistStudyOutputToUserVault({
          title: `${file ? file.name : "Document"} - ${topic}`,
          type: "ppt",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: "",
          flashcards: [],
          slides: data.ppt.slides,
          focusArea: topic,
        });

        if (user) {
          await addDoc(collection(db, "users", user.uid, "documents"), {
            title: `${file ? file.name : "Document"} - ${topic}`,
            type: "ppt",
            fileUri: fileData.fileUri,
            mimeType: fileData.mimeType,
            resultText: "",
            flashcards: [],
            slides: data.ppt.slides,
            focusArea: topic,
            createdAt: serverTimestamp()
          });
        }
      } else {
        throw new Error("No slides returned from the presentation generator. Please try another topic.");
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };

  const generatePPT = async () => {
    openPPTTopicStudio();
  };
  const generateVideoExplanation = async (topicOverride?: string | React.MouseEvent) => {
    if (!fileData) return;
    const effectiveFocus =
      typeof topicOverride === "string" && topicOverride.trim().length > 0
        ? topicOverride.trim()
        : (activeScanFocusTopic || focusArea || "").trim();

    setLoading(true);
    setGeneratingType("video");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota (unless user explicitly requested a new custom topic)
      if (typeof topicOverride !== "string") {
        const cached = history.find(
          (item) =>
            item.fileUri === fileData.fileUri &&
            item.type === "video" &&
            (item.focusArea || "") === effectiveFocus
        );
        if (cached && cached.videoData) {
          setVideoData(cached.videoData);
          setResultType("video");
          setResultText("");
          setFlashcards([]);
          setLessonPlan(null);
          setShowDigitalScannerHub(false);
          setLoading(false);
          setGeneratingType("");
          return;
        }
      }

      lastActionRef.current = () => generateVideoExplanation(typeof topicOverride === "string" ? topicOverride : undefined);
      const fallbackDocText =
        scannedDigitalText ||
        extractedTextCacheRef.current.get(fileData.fileUri) ||
        digitalScanReport?.textPreview ||
        resultText ||
        "";

      const data = await apiFetchJson("/api/generate-video-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          focusArea: effectiveFocus,
          fallbackText: fallbackDocText,
          model: selectedAiModel,
        }),
      });

      setVideoData(data.video || null);
      setResultType("video");
      setResultText("");
      setFlashcards([]);
      setLessonPlan(null);
      setShowDigitalScannerHub(false);

      if (data.video) {
        setGeneratedFunctionsCache((prev) => ({
          ...prev,
          video: {
            label: "Video Lecture",
            resultType: "video",
            videoData: data.video,
          },
        }));
      }

      await persistStudyOutputToUserVault({
        title: effectiveFocus
          ? `${file ? file.name : "Lecture Video"} — ${effectiveFocus}`
          : file
            ? file.name
            : "Lecture Video",
        type: "video",
        fileUri: fileData.fileUri,
        mimeType: fileData.mimeType,
        resultText: "",
        flashcards: [],
        videoData: data.video || null,
        focusArea: effectiveFocus,
      });

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: effectiveFocus
            ? `${file ? file.name : "Lecture Video"} — ${effectiveFocus}`
            : file
              ? file.name
              : "Lecture Video",
          type: "video",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: "",
          flashcards: [],
          videoData: data.video || null,
          focusArea: effectiveFocus,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };


  const downloadMarkdown = () => {
    if (!displayedResultText) return;
    const blob = new Blob([displayedResultText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file ? file.name.replace(/\.[^/.]+$/, "") : "Notivexa"}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const downloadDoc = () => {
    if (!notesRef.current) return;
    const htmlContent = notesRef.current.innerHTML;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Export HTML to Word Document</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        h1, h2, h3, h4, h5, h6 { color: #2d2d2a; }
        p, li { color: #3a3a2f; }
        svg { display: none; }
      </style>
    </head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
        type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = url;
    fileDownload.download = `${file ? file.name.replace(/\.[^/.]+$/, "") : "Notivexa"}_Notes.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };
  const downloadHandwrittenPDF = async (fast: boolean = false, customFileName?: string) => {
    if (!notesRef.current) return;

    const originalGetComputedStyle = window.getComputedStyle;
    const temporarilyUnhiddenSheets: HTMLElement[] = [];

    // Temporarily monkeypatch window.getComputedStyle to translate OKLAB and OKLCH colors to RGB/RGBA
    // because html2canvas does not support modern color functions used by Tailwind v4.
    const patchedGetComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      return createColorSafeStyleProxy(style);
    };
    window.getComputedStyle = patchedGetComputedStyle as any;

    try {
      setIsExporting(true);
      setExportProgress(8);
      setExportStatus("Preparing exact preview pages for fast 1:1 PDF download...");

      await document.fonts.ready;

      const element = notesRef.current;
      const isStudent = mode === "student";
      const activeHandwritingCssFont = getHandwritingFontFamily(handwritingFont);
      const primaryInkHex = penColor === "blue" ? "#1d4ed8" : "#1e293b";
      const headingInkHex = penColor === "blue" ? "#0f172a" : "#1d4ed8";

      // Collect the exact sheets displayed in the Google AI Studio interface (#summary-page-0, #summary-page-1, ...)
      const summaryPageNodes = Array.from(
        element.querySelectorAll<HTMLElement>('[id^="summary-page-"]')
      );
      const tocSheetNode =
        resultType !== "verbatim-handwriting" && summaryPageNodes.length > 1
          ? element.querySelector<HTMLElement>('[data-toc-sheet="true"]')
          : null;

      const sheetsToCapture: HTMLElement[] = [
        ...(tocSheetNode ? [tocSheetNode] : []),
        ...(summaryPageNodes.length > 0 ? summaryPageNodes : [element]),
      ];

      // Temporarily unhide any sheets that are hidden in Single Page view mode so all exact UI pages are captured
      sheetsToCapture.forEach((sheet) => {
        if (sheet.classList.contains("hidden")) {
          sheet.classList.remove("hidden");
          temporarilyUnhiddenSheets.push(sheet);
        }
      });

      if (temporarilyUnhiddenSheets.length > 0) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }

      const numPages = sheetsToCapture.length;
      // Fast mode uses a lightweight crisp scale & JPEG quality for near-instant download of the exact UI pages
      const renderScale = fast ? 1.35 : numPages >= 20 ? 1.35 : 1.75;
      const jpegQuality = fast ? 0.82 : 0.90;

      setExportProgress(20);
      setExportStatus(
        `Capturing ${numPages} exact ${numPages === 1 ? "page" : "pages"} as shown in the interface...`
      );

      const capturedCanvases: HTMLCanvasElement[] = new Array(numPages);
      const BATCH_SIZE = fast ? 3 : 2;

      for (let batchStart = 0; batchStart < numPages; batchStart += BATCH_SIZE) {
        const batchIndices: number[] = [];
        for (let k = batchStart; k < Math.min(numPages, batchStart + BATCH_SIZE); k++) {
          batchIndices.push(k);
        }

        setExportProgress(Math.round(22 + (batchStart / numPages) * 65));
        setExportStatus(
          numPages === 1
            ? "Rendering exact same-to-same page..."
            : `Rendering exact page ${batchStart + 1} of ${numPages}...`
        );

        const batchResults = await Promise.all(
          batchIndices.map(async (pageIndex) => {
            const pageElem = sheetsToCapture[pageIndex];
            const sheetWidth = Math.max(680, pageElem.offsetWidth || 794);
            const sheetHeight = Math.max(240, pageElem.offsetHeight || 1123);

            return html2canvas(pageElem, {
              scale: renderScale,
              useCORS: true,
              logging: false,
              backgroundColor: isStudent && resultType !== "exam-paper" ? "#FCFBF7" : "#ffffff",
              width: sheetWidth,
              height: sheetHeight,
              windowWidth: Math.max(1280, window.innerWidth || 1280),
              onclone: (clonedDoc: Document, clonedElem: HTMLElement) => {
                if (clonedDoc.defaultView) {
                  clonedDoc.defaultView.getComputedStyle = patchedGetComputedStyle as any;
                }
                try {
                  clonedElem.classList.remove("hidden");
                  clonedElem.style.boxShadow = "none";
                  clonedElem.style.margin = "0";
                  if (isStudent && resultType !== "exam-paper") {
                    clonedElem.style.fontFamily = activeHandwritingCssFont;
                    const textNodes = clonedElem.querySelectorAll(
                      "h1, h2, h3, h4, h5, h6, p, li, td, th, strong, em, span"
                    );
                    textNodes.forEach((node) => {
                      const el = node as HTMLElement;
                      if (!el.classList.contains("font-mono")) {
                        el.style.fontFamily = activeHandwritingCssFont;
                      }
                      if (
                        /^H[1-6]$/.test(el.tagName) ||
                        el.tagName === "TH" ||
                        el.closest("h1, h2, h3, h4, h5, h6, th")
                      ) {
                        el.style.color = headingInkHex;
                      } else if (!el.classList.contains("text-rose-400")) {
                        el.style.color = primaryInkHex;
                      }
                    });
                  }

                  const svgElements = clonedElem.querySelectorAll("svg");
                  svgElements.forEach((svg) => {
                    const s = svg as unknown as HTMLElement;
                    s.style.maxWidth = "100%";
                    s.style.height = "auto";
                  });

                  const allElements = clonedDoc.querySelectorAll("*");
                  allElements.forEach((node) => {
                    const el = node as HTMLElement;
                    if (el.style && el.style.cssText) {
                      if (
                        el.style.cssText.includes("okl") ||
                        el.style.cssText.includes("color(")
                      ) {
                        el.style.cssText = sanitizeCssColors(el.style.cssText);
                      }
                    }
                  });
                } catch {
                  // Ignore DOM clone sanitization exceptions
                }
              },
            });
          })
        );

        batchResults.forEach((canvas, idx) => {
          capturedCanvases[batchIndices[idx]] = canvas;
        });
      }

      setExportProgress(90);
      setExportStatus("Packaging exact same-to-same PDF pages...");

      const pdfPageWidthMm = 210;
      const firstCanvas = capturedCanvases[0];
      const firstPageHeightMm = Math.max(
        80,
        Math.round(((firstCanvas.height * pdfPageWidthMm) / firstCanvas.width) * 10) / 10
      );

      const pdf = new jsPDF({
        orientation: firstPageHeightMm >= pdfPageWidthMm ? "p" : "l",
        unit: "mm",
        format: [pdfPageWidthMm, firstPageHeightMm],
        compress: true,
      });

      for (let i = 0; i < capturedCanvases.length; i++) {
        const canvas = capturedCanvases[i];
        const pageHeightMm = Math.max(
          80,
          Math.round(((canvas.height * pdfPageWidthMm) / canvas.width) * 10) / 10
        );

        if (i > 0) {
          pdf.addPage(
            [pdfPageWidthMm, pageHeightMm],
            pageHeightMm >= pdfPageWidthMm ? "p" : "l"
          );
        }

        const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
        const currentW = pdf.internal.pageSize.getWidth();
        const currentH = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "JPEG", 0, 0, currentW, currentH, undefined, "FAST");
      }

      setExportProgress(97);
      setExportStatus("Saving PDF file...");

      const sanitizeFileName = (name: string) =>
        name.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
      let defaultName =
        resultType === "verbatim-handwriting"
          ? "Same_To_Same_Handwritten_Pages.pdf"
          : "Student_Handwriting_Notes.pdf";
      if (resultType === "verbatim-handwriting" && file) {
        defaultName = `${sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""))}_Same_To_Same_Handwritten.pdf`;
      } else if (selectedUnit !== "all" || selectedChapter !== "all") {
        const uPart = selectedUnit !== "all" ? sanitizeFileName(selectedUnit) : "";
        const cPart = selectedChapter !== "all" ? sanitizeFileName(selectedChapter) : "";
        defaultName = `${[uPart, cPart].filter(Boolean).join("_")}_Handwriting_Notes.pdf`;
      } else if (file) {
        defaultName = `${sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""))}_Handwriting_Notes.pdf`;
      }
      pdf.save(customFileName || defaultName);
      setExportProgress(100);
      setExportStatus("Export Complete!");
    } catch (err: any) {
      console.error("PDF export failed:", err);
      window.print();
    } finally {
      temporarilyUnhiddenSheets.forEach((sheet) => {
        sheet.classList.add("hidden");
      });
      window.getComputedStyle = originalGetComputedStyle;
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 500);
    }
  };

  const todayDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const getPageSheetStyle = (): React.CSSProperties => {
    const isStudent = mode === 'student' && resultType !== 'exam-paper';
    const base: React.CSSProperties = {
      width: '210mm',
      minHeight: '297mm',
      boxSizing: 'border-box',
      maxWidth: '100%',
    };
    if (!isStudent) return base;

    return {
      ...base,
      backgroundColor: '#FCFBF7',
      backgroundImage: pageStyle === 'ruled' 
        ? 'repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)' 
        : pageStyle === 'box' 
          ? 'repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)' 
          : 'none',
      backgroundPosition: '0 64px',
      backgroundAttachment: 'local',
      lineHeight: '32px',
      fontFamily: getHandwritingFontFamily(handwritingFont),
      // @ts-ignore
      '--tw-prose-body': penColor === 'blue' ? '#1d4ed8' : '#1e293b',
      '--tw-prose-headings': penColor === 'blue' ? '#0f172a' : '#1d4ed8',
      '--tw-prose-bold': 'inherit',
      '--tw-prose-th-borders': penColor === 'blue' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(29, 78, 216, 0.35)',
      '--tw-prose-td-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.25)' : 'rgba(30, 41, 59, 0.25)',
      color: penColor === 'blue' ? '#1d4ed8' : '#1e293b',
    };
  };

  const markdownComponents = useMemo(() => {
    const isStudentHandwriting = mode === 'student' && resultType !== 'exam-paper';
    // When Blue Pen is selected -> Headings & Subheadings in Black Pen (#0f172a), Sentences in Blue Pen (#1d4ed8)
    // When Black Pen is selected -> Headings & Subheadings in Blue Pen (#1d4ed8), Sentences in Black Pen (#1e293b)
    const studentHeadingColor = penColor === 'blue' ? '!text-[#0f172a]' : '!text-[#1d4ed8]';
    const studentSentenceColor = penColor === 'blue' ? '!text-[#1d4ed8]' : '!text-[#1e293b]';
    const studentUnderline = penColor === 'blue' ? 'border-b-2 border-slate-800/70 pb-0.5' : 'border-b-2 border-[#2563eb]/70 pb-0.5';

    const extractNodeText = (nodeChildren: any): string => {
      if (nodeChildren === null || nodeChildren === undefined) return "";
      if (typeof nodeChildren === "string" || typeof nodeChildren === "number") return String(nodeChildren);
      if (Array.isArray(nodeChildren)) return nodeChildren.map(extractNodeText).join("");
      if (typeof nodeChildren === "object" && nodeChildren.props?.children !== undefined) {
        return extractNodeText(nodeChildren.props.children);
      }
      return "";
    };

    return {
    table: ({ node, ...props }: any) => (
      <div className="my-1.5 w-full max-w-full overflow-x-auto">
        <table
          className={`w-full max-w-full border-collapse table-auto ${
            isStudentHandwriting
              ? `border-[1.5px] bg-white/45 rounded-xs shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                  penColor === 'blue' ? 'border-[#0f172a]/70' : 'border-[#1d4ed8]/70'
                }`
              : 'border border-black'
          }`}
          {...props}
        />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead
        className={
          isStudentHandwriting
            ? `bg-slate-100/70 border-b-2 ${
                penColor === 'blue' ? 'border-[#0f172a]/70' : 'border-[#1d4ed8]/70'
              }`
            : 'bg-gray-100'
        }
        {...props}
      />
    ),
    th: ({ node, children, ...props }: any) => {
      const cellText = extractNodeText(children).trim();
      const isProseHeader =
        /^(?:contents?|remarks?|description|details?|topics?|activity|activities|summary|observations?|explanations?|functions?|conditions?|actions?|parameters?|notes?|objectives?|outcomes?|methodology|title|name|protocols?|devices?)$/i.test(
          cellText
        );
      const isCompactHeader =
        !isProseHeader &&
        cellText.length > 0 &&
        cellText.length <= 10 &&
        (/^(?:date|week|week\s*no\.?|sr\.?\s*no\.?|s\.?\s*no\.?|no\.?|id|roll\s*no\.?|marks?|grade|year|day|code|time|status|stable\??|layer\s*no\.?|q\.?\s*no\.?)$/i.test(
          cellText
        ) ||
          cellText.length <= 5);
      return (
        <th
          className={`py-1.5 px-2.5 align-middle box-border ${
            isCompactHeader
              ? 'w-[1%] whitespace-nowrap text-center'
              : 'w-auto min-w-[140px] whitespace-normal break-words [overflow-wrap:anywhere] [word-break:break-word] text-left'
          } ${
            isStudentHandwriting
              ? `border-[1.5px] font-bold text-[17.5px] leading-[22px] ${studentHeadingColor} ${handwritingFont} ${
                  penColor === 'blue' ? 'border-[#0f172a]/65' : 'border-[#1d4ed8]/65'
                }`
              : 'border border-black bg-gray-200 p-2'
          }`}
          {...props}
        >
          {children}
        </th>
      );
    },
    td: ({ node, children, ...props }: any) => {
      const cellText = extractNodeText(children).trim();
      const isDateOrShortValue =
        cellText.length > 0 &&
        cellText.length <= 10 &&
        (!/\s/.test(cellText) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(cellText));
      const isCenteredShortValue =
        /^(?:\d+[.)]?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|yes|no|layer\s*\d+)$/i.test(cellText);
      return (
        <td
          className={`py-1.5 px-2.5 align-top box-border ${
            isDateOrShortValue
              ? `w-[1%] whitespace-nowrap ${isCenteredShortValue ? 'text-center' : 'text-left'}`
              : 'w-auto whitespace-normal break-words [overflow-wrap:anywhere] [word-break:break-word] text-left'
          } ${
            isStudentHandwriting
              ? `border-[1.25px] text-[16.5px] leading-[23px] ${studentSentenceColor} ${handwritingFont} ${
                  penColor === 'blue' ? 'border-[#0f172a]/55' : 'border-[#1e293b]/55'
                }`
              : 'border border-black p-2'
          }`}
          {...props}
        >
          {children}
        </td>
      );
    },
    li: ({ node, ...props }: any) => (
      <li className={`mb-1.5 marker:text-rose-400 marker:font-bold ${isStudentHandwriting ? `${studentSentenceColor} ${handwritingFont}` : 'text-blue-600'}`} {...props} />
    ),
    h1: ({ children }: any) => (
      <h1 className={isStudentHandwriting
        ? `text-2xl md:text-3xl mt-3 mb-2 font-bold ${handwritingFont} ${studentHeadingColor} ${studentUnderline} leading-snug tracking-normal`
        : "text-3xl md:text-4xl mt-3 mb-2 font-extrabold !text-black leading-tight tracking-tight"}>{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className={isStudentHandwriting
        ? `text-xl md:text-2xl mt-2.5 mb-1.5 font-bold ${handwritingFont} ${studentHeadingColor} ${studentUnderline} inline-block leading-snug`
        : "text-2xl md:text-3xl mt-3 mb-2 font-bold !text-black leading-snug tracking-tight"}>{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className={isStudentHandwriting
        ? `text-lg md:text-xl mt-2 mb-1 font-bold ${handwritingFont} ${studentHeadingColor} underline decoration-dotted underline-offset-4`
        : "text-xl md:text-2xl mt-2.5 mb-1.5 font-bold !text-black"}>{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className={isStudentHandwriting ? `font-bold ${handwritingFont} ${studentHeadingColor}` : "font-bold !text-black"}>{children}</h4>
    ),
    h5: ({ children }: any) => (
      <h5 className={isStudentHandwriting ? `font-bold ${handwritingFont} ${studentHeadingColor}` : "font-bold !text-black"}>{children}</h5>
    ),
    h6: ({ children }: any) => (
      <h6 className={isStudentHandwriting ? `font-bold ${handwritingFont} ${studentHeadingColor}` : "font-bold !text-black"}>{children}</h6>
    ),
    strong: ({ children }: any) => (
      <strong className={isStudentHandwriting ? `font-bold ${penColor === 'blue' ? '!text-[#0f172a]' : '!text-[#1d4ed8]'} bg-amber-200/40 px-1 py-0.5 rounded-[2px] shadow-[0_1px_1px_rgba(0,0,0,0.02)] border-b border-amber-300/40` : 'font-bold !text-black'}>{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className={isStudentHandwriting ? 'text-inherit font-medium' : 'text-blue-600'}>{children}</em>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className={isStudentHandwriting
        ? `my-3 border-l-4 border-rose-400/80 bg-amber-50/50 rounded-r-md px-4 py-1.5 italic ${studentSentenceColor} ${handwritingFont} text-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]`
        : "border-l-4 border-slate-300 pl-4 py-2 my-3 italic text-slate-700"}>{children}</blockquote>
    ),
    hr: () => (
      <hr className={isStudentHandwriting ? "border-t border-dashed border-rose-300/70 my-3" : "my-4 border-slate-300"} />
    ),
    pre({ node, children, ...props }: any) {
      return (
        <pre {...props} className={`${props.className || ''} ${(mode === 'student' && resultType !== 'exam-paper') ? 'bg-[#F9F9F7] border border-[#E0E0D5] rounded p-4' : 'bg-gray-100 p-2'}`}>
          {children}
        </pre>
      );
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'mermaid') {
        const chartText = String(children).replace(/\n$/, '');
        const isMermaid = /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|xychart|requirement|C4|mindmap|timeline|block|packet|architecture|kanban|sankey)/i.test(chartText);
        if (isMermaid) {
          return <MermaidChart chart={chartText} handwritingFont={handwritingFont} mode={mode} penColor={penColor} />;
        }
      }

      return (
        <code className={`${className} ${(mode === 'student' && resultType !== 'exam-paper') && !inline ? `${handwritingFont} text-lg` : ''}`} {...props}>
          {children}
        </code>
      );
    },
    p: ({ node, children, ...props }: any) => {
      const isStudent = mode === 'student' && resultType !== 'exam-paper';
      const pClass = `mb-4 ${isStudent ? `text-inherit ${handwritingFont}` : 'text-blue-600'}`;
      const content = String(children);
      if (content.includes("[DIAGRAM:")) {
        const match = content.match(/\[DIAGRAM:(.*?)\]/);
        const label = match ? match[1].trim() : "Diagram Placeholder";
        return (
          <div className="my-10 border border-[#D1D1C4] rounded-2xl p-10 flex flex-col items-center justify-center bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] min-h-[250px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#5A5A40] opacity-20"></div>
            <span className="bg-[#FAF9F6] text-[#8A8A7A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-[#E0E0D5]">Missing Diagram</span>
            <span className="text-[#3A3A2F] font-serif text-xl text-center max-w-md leading-snug">{label}</span>
            <p className="text-[#A1A194] font-sans text-xs mt-4 text-center">Gemini could not automatically extract this diagram as Mermaid code.</p>
          </div>
        );
      }

      if (/^Q\d+\.\s+/.test(content) && content.includes("Correct Answer:")) {
        const parts = content.split(/(A\)\s+|B\)\s+|C\)\s+|D\)\s+|Correct Answer:)/);
        return (
          <p className="whitespace-pre-wrap">
            {parts.map((part, i) => {
              if (part.startsWith('A)') || part.startsWith('B)') || part.startsWith('C)') || part.startsWith('D)')) {
                return <span key={i} className="block">{part}</span>;
              }
              if (part.startsWith('Correct Answer:')) {
                return <strong key={i} className="block text-black mt-2">{part}</strong>;
              }
              return <strong key={i} className="block text-black font-bold">{part}</strong>;
            })}
          </p>
        );
      }

      if (typeof children === 'string' && children.includes('?')) {
        return <p className="font-bold text-black">{children}</p>;
      }

      return <p className={pClass} {...props}>{children}</p>;
    }
  };
  }, [mode, resultType, penColor, handwritingFont]);

  if (authLoading) {
    return (
      <div className={`flex h-screen items-center justify-center transition-colors ${isDarkMode ? "bg-[#181816]" : "bg-[#F5F5F0]"}`}>
        <Loader2 className={`animate-spin ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`} size={40} />
      </div>
    );
  }

  if (!user && !isQuickGuest) {
    return (
      <div className={`flex min-h-screen items-center justify-center font-sans transition-colors relative overflow-hidden ${isDarkMode ? "bg-[#131311] text-[#E0E0D5]" : "bg-[#FDFDFB] text-[#2D2D2A]"}`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2400&q=90')] bg-cover bg-center" />
        <div className={`absolute inset-0 ${isDarkMode ? "bg-gradient-to-br from-[#111827]/75 via-[#172554]/65 to-[#131311]/80" : "bg-gradient-to-br from-slate-900/35 via-sky-950/25 to-slate-900/45"}`} />

        <div className={`p-10 md:p-12 rounded-[32px] border text-center max-w-md w-full relative z-10 transition-colors backdrop-blur-xl ${
          isDarkMode ? "bg-[#22221F]/90 border-[#383832] shadow-[0_16px_48px_rgba(0,0,0,0.42)]" : "bg-white/90 border-white/75 shadow-[0_16px_48px_rgba(15,23,42,0.2)]"
        }`}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Late-Night Study Dark Mode"}
            className={`absolute top-4 right-4 p-2.5 rounded-full border transition-all ${
              isDarkMode 
                ? "bg-[#2D2D2A] border-[#4A4A3F] text-[#FACC15] hover:bg-[#383832]" 
                : "bg-[#FAF9F6] border-[#E0E0D5] text-[#5A5A40] hover:bg-[#E8E8E0]"
            }`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-600 rounded-[24px] shadow-xl shadow-sky-500/25 text-white flex items-center justify-center mb-6 transform hover:scale-105 transition-all">
            <BookOpen size={36} />
          </div>
          <h1 className={`text-3xl font-bold font-serif mb-2 tracking-tight ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
            Welcome to <br />Notivexa <span className="bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Sign in to generate notes, flashcards, and presentations immediately.
          </p>

          <AuthForm isDarkMode={isDarkMode} />
          
          <div className="flex items-center my-6 opacity-70">
            <div className={`flex-1 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}></div>
            <div className={`px-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Or continue with</div>
            <div className={`flex-1 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}></div>
          </div>
          
          <button 
            type="button"
            onClick={handleSignIn}
            disabled={isGoogleSigningIn}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
              isDarkMode
                ? "bg-[#2D2D2A] text-white hover:bg-[#383832] border border-slate-700"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
            }`}
          >
            {isGoogleSigningIn ? (
              <>
                <Loader2 size={18} className="animate-spin text-sky-500" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </>
            )}
            </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("notivexa_require_signin");
              sessionStorage.setItem("notivexa_quick_access", "true");
              setIsQuickGuest(true);
            }}
            className="mt-2.5 w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Continue to Study Workspace (Instant Access)</span>
          </button>

          {signInError && (
            <div
              className={`mt-4 p-3.5 rounded-xl text-xs text-left flex flex-col gap-2 transition-all ${
                isDarkMode
                  ? "bg-amber-950/40 text-amber-200 border border-amber-800/60"
                  : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                <span className="leading-relaxed">{signInError}</span>
              </div>
              {typeof window !== "undefined" && signInError.includes("Authorized domains") && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <code className={`px-2 py-1 rounded text-[11px] font-mono truncate flex-1 ${isDarkMode ? "bg-black/30 text-amber-300" : "bg-white text-slate-700 border border-amber-200"}`}>
                    {window.location.hostname}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.hostname);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2000);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                      isDarkMode
                        ? "bg-amber-800/50 hover:bg-amber-800 text-amber-100"
                        : "bg-amber-200/80 hover:bg-amber-300/80 text-amber-950"
                    }`}
                  >
                    {copiedDomain ? "Copied!" : "Copy Domain"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportWrapperRef}
      className={`fixed inset-0 w-full h-full overflow-hidden ${
        isDarkMode
          ? "bg-[#131311] text-[#E0E0D5] dark"
          : "bg-gradient-to-br from-[#dcebf1] via-[#eaf1f7] to-[#e5eaf4] text-slate-800"
      }`}
    >
      <div
        style={
          effectiveUiZoom !== 1
            ? {
                zoom: effectiveUiZoom,
                width: `${Math.ceil(windowWidth / effectiveUiZoom)}px`,
                height: `${Math.ceil(windowHeight / effectiveUiZoom)}px`,
                minHeight: `${Math.ceil(windowHeight / effectiveUiZoom)}px`,
              }
            : {
                width: "100%",
                height: "100%",
                minHeight: "100%",
              }
        }
        className={`relative isolate grid ${
          isSidebarOpen
            ? "grid-cols-[185px_minmax(0,1fr)] sm:grid-cols-[205px_minmax(0,1fr)] lg:grid-cols-[225px_minmax(0,1fr)]"
            : "grid-cols-1"
        } grid-rows-[auto_minmax(0,1fr)] gap-1.5 sm:gap-2.5 overflow-hidden p-1.5 sm:p-2.5 font-sans transition-colors duration-300 ${
          isDarkMode
            ? "bg-[#131311] text-[#E0E0D5] dark"
            : "bg-gradient-to-br from-[#dcebf1] via-[#eaf1f7] to-[#e5eaf4] text-slate-800"
        }`}
      >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? "radial-gradient(ellipse at 82% 8%, rgba(99,102,241,.18), transparent 34%), radial-gradient(ellipse at 14% 18%, rgba(56,189,248,.08), transparent 32%), linear-gradient(135deg, #171b2b 0%, #192132 54%, #211d35 100%)"
              : "radial-gradient(ellipse at 82% 8%, rgba(147,197,253,.5), transparent 34%), radial-gradient(ellipse at 14% 14%, rgba(255,255,255,.96), transparent 38%), linear-gradient(135deg, #fbfdff 0%, #eef7ff 54%, #f2f0ff 100%)",
          }}
        />
        <svg
          className={`absolute inset-0 h-full w-full ${isDarkMode ? "opacity-30" : "opacity-80"}`}
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="app-bg-blue-wave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity=".42" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity=".08" />
            </linearGradient>
            <linearGradient id="app-bg-violet-wave" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity=".36" />
              <stop offset="100%" stopColor="#a5b4fc" stopOpacity=".04" />
            </linearGradient>
          </defs>
          <path d="M0 662C155 586 276 627 423 706C573 787 717 814 873 753C1029 692 1150 641 1291 687C1405 724 1507 651 1600 584V900H0V662Z" fill="url(#app-bg-blue-wave)" />
          <path d="M0 780C159 704 296 738 440 792C601 852 768 863 929 803C1092 742 1219 715 1366 768C1454 800 1533 778 1600 739V900H0V780Z" fill="#fff" fillOpacity=".46" />
          <path d="M1600 0H1510C1444 80 1385 150 1318 197C1381 238 1451 240 1518 207C1550 191 1578 170 1600 146V0Z" fill="url(#app-bg-violet-wave)" />
          <path d="M0 708C168 635 290 665 438 739C589 815 726 829 884 772C1039 716 1151 672 1291 711C1414 747 1511 680 1600 621" fill="none" stroke="#fff" strokeWidth="3" strokeOpacity=".46" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <header className={`col-span-full relative z-30 flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md ${isDarkMode ? "border-[#383832] bg-[#22221F]/95 shadow-[0_8px_28px_rgba(0,0,0,0.25)]" : "border-white/70 bg-white/95 shadow-[0_8px_28px_rgba(15,23,42,0.08)]"}`}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? "Collapse study panel" : "Expand study panel"}
            aria-expanded={isSidebarOpen}
            title={isSidebarOpen ? "Collapse study panel" : "Expand study panel"}
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${isDarkMode ? "border-[#383832] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}
          >
            <Menu size={18} />
          </button>
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white shadow-sm">
            <GraduationCap size={19} />
          </div>
          <div className="min-w-0">
            <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] truncate ${isDarkMode ? "text-sky-300" : "text-sky-700"}`}>Notivexa AI</p>
            <p className={`hidden sm:block truncate text-sm font-semibold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>Study workspace</p>
          </div>
        </div>
        <nav aria-label="Education navigation" className="order-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto pt-1 sm:pt-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:order-2 lg:w-auto lg:flex-1 lg:justify-center">
          <button
            type="button"
            onClick={() => navigateToSection("materials")}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold transition-colors ${isDarkMode ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white" : "text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}
          >
            <House size={14} />
            <span>Home</span>
          </button>
          {([
            { id: "materials", label: "Study Materials", icon: Upload },
            { id: "library", label: "E-Library", icon: BookOpen },
            { id: "tools", label: "AI Study Tools", icon: Sparkles },
            { id: "learning", label: "My Learning", icon: GraduationCap },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigateToSection(id)}
              aria-current={activeNav === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold transition-colors ${
                activeNav === id
                  ? "bg-sky-700 text-white shadow-sm"
                  : isDarkMode
                    ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-800"
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold transition-colors ${isDarkMode ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white" : "text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}
          >
            <Info size={14} />
            <span>About Us</span>
          </button>
          <a
            href="mailto:support@notivexa.com?subject=Notivexa%20AI%20Support"
            className={`hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${isDarkMode ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white" : "text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}
          >
            <Mail size={14} />
            <span>support@notivexa.com</span>
          </a>
        </nav>
        <div className="order-2 ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 lg:order-3 min-w-0">
          <label
            title="Adjust application UI zoom scale for small windows or mobile view"
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold transition-colors ${
              isDarkMode
                ? "border-[#4A4A3F] bg-[#2D2D2A] text-[#C2C2B0]"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider opacity-75">Zoom</span>
            <select
              value={uiZoomMode}
              onChange={(e) =>
                setUiZoomMode(e.target.value as "auto" | "0.65" | "0.75" | "0.85" | "0.92" | "1")
              }
              aria-label="UI Zoom Scale"
              className="bg-transparent font-extrabold outline-none cursor-pointer text-[10px]"
            >
              <option value="auto" className="text-slate-900">
                Auto ({Math.round(effectiveUiZoom * 100)}%)
              </option>
              <option value="0.65" className="text-slate-900">65%</option>
              <option value="0.75" className="text-slate-900">75%</option>
              <option value="0.85" className="text-slate-900">85%</option>
              <option value="0.92" className="text-slate-900">92%</option>
              <option value="1" className="text-slate-900">100%</option>
            </select>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((show) => !show)}
              aria-label="Notifications and recent study activity"
              aria-expanded={showNotifications}
              title="Notifications"
              className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-colors ${isDarkMode ? "border-[#4A4A3F] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}
            >
              <Bell size={15} />
            </button>
            {showNotifications && (
              <div className={`absolute right-0 top-11 z-50 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border shadow-xl ${isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-200 bg-white"}`}>
                <div className={`border-b px-4 py-3 ${isDarkMode ? "border-[#383832]" : "border-slate-100"}`}>
                  <p className={`text-sm font-semibold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>Recent study activity</p>
                </div>
                {historyDeleteError && (
                  <p role="alert" className="px-4 pt-3 text-xs text-red-600">{historyDeleteError}</p>
                )}
                {historyLoading ? (
                  <p className={`px-4 py-5 text-sm ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Loading activity…</p>
                ) : history.length === 0 ? (
                  <p className={`px-4 py-5 text-sm ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>No study activity yet.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-1">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id} className={`flex items-start gap-2 px-3 py-2 ${isDarkMode ? "hover:bg-[#2D2D2A]" : "hover:bg-sky-50"}`}>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectHistoryItem(item);
                            setShowNotifications(false);
                            navigateToSection("learning");
                          }}
                          className="flex min-w-0 flex-1 items-start gap-3 py-1 text-left"
                        >
                          <FileText size={16} className="mt-0.5 shrink-0 text-sky-600" />
                          <span className="min-w-0">
                            <span className={`block truncate text-sm font-medium ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"}`}>{item.title}</span>
                            <span className={`mt-0.5 block text-[11px] capitalize ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>{item.type.replaceAll("-", " ")}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void handleDeleteHistoryItem(e, item.id)}
                          disabled={deletingHistoryId !== null}
                          aria-label={`Delete ${item.title} from study history`}
                          title="Delete from history"
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "text-[#A1A194] hover:bg-red-950/40 hover:text-red-300" : "text-slate-400 hover:bg-red-50 hover:text-red-600"}`}
                        >
                          {deletingHistoryId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSettingsTab("general");
              setShowSettings(true);
              setShowNotifications(false);
            }}
            aria-label="Settings and My Storage"
            title="Settings (Check My Storage & Preferences)"
            className={`flex h-8 sm:h-10 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
              isDarkMode
                ? "border-[#4A4A3F] text-[#C2C2B0] hover:bg-[#383832] hover:text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-800"
            }`}
          >
            <Settings size={15} />
            <span className="hidden md:inline">Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            aria-label="About Notivexa AI"
            title="About"
            className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${isDarkMode ? "border-[#4A4A3F] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}
          >
            <Info size={17} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Late-Night Study Dark Mode"}
            className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-colors ${isDarkMode ? "border-[#4A4A3F] bg-[#2D2D2A] text-[#FACC15] hover:bg-[#383832]" : "border-slate-200 bg-white text-amber-600 hover:bg-slate-50"}`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <UserProfile 
            user={user} 
            isDarkMode={isDarkMode} 
            onSignOut={handleSignOut} 
            onOpenMfa={() => setShowMfaModal(true)} 
          />
        </div>
      </header>

      {/* Compact Small-Size Sidebar (Side-by-Side on All Window Sizes) */}
      {isSidebarOpen && (
      <div id="study-sidebar" className={`relative z-20 w-full h-full border-r flex flex-col rounded-[18px] overflow-hidden transition-all duration-300 ${
        isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5] shadow-[0_6px_20px_rgba(0,0,0,0.3)]" : "bg-gradient-to-br from-white via-sky-50/95 to-indigo-50/90 backdrop-blur-xl border-sky-100/80 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      }`}>
        {/* Compact Sidebar Top Bar */}
        <div className={`flex items-center justify-between px-2.5 py-2 border-b ${
          isDarkMode ? "border-[#383832] bg-[#1C1C19]" : "border-slate-200/80 bg-white/90"
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-600 to-indigo-600 text-white">
              <Sparkles size={11} />
            </span>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider truncate ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
              Study Tools
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Minimize sidebar"
            title="Minimize sidebar"
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isDarkMode ? "border-[#383832] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <X size={12} />
          </button>
        </div>

        {/* Scrollable middle container */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3 min-h-0 custom-scrollbar">
          
          {/* Late-Night Study Mode Quick Switch */}
          <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1.5 ${
            isDarkMode 
              ? "bg-[#2A2A26] border-[#45453B]" 
              : "bg-gradient-to-r from-sky-50/80 to-indigo-50/50 border-sky-200/60 shadow-xs"
          }`}>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${isDarkMode ? "bg-[#383832] text-[#FACC15]" : "bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs"}`}>
                {isDarkMode ? <Moon size={13} /> : <Sun size={13} />}
              </div>
              <div className="min-w-0">
                <span className={`text-[11px] font-bold block truncate transition-colors ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
                  {isDarkMode ? "Night Mode" : "Daylight"}
                </span>
                <span className="text-[9px] text-slate-500 block truncate">Eye-soothing</span>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                isDarkMode ? "bg-[#5A5A40]" : "bg-sky-500"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Study Material Source */}
          <div id="material-source" className="scroll-mt-6">
            <label className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider mb-2 block">
              Study Material Source
            </label>
            
            {/* Custom Tabs */}
            <div className={`flex p-0.5 rounded-full border mb-2.5 transition-colors ${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-slate-100/90 border-slate-200/80"}`}>
              <button
                onClick={() => {
                  setInputType("upload");
                  setFile(null);
                  setFileData(null);
                }
}
                className={`flex-1 py-2 px-1 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${inputType === "upload" ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20" : isDarkMode ? "text-[#A1A194] hover:text-[#E0E0D5]" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Upload size={12} /> Upload File
              </button>
              <button
                onClick={() => {
                  setInputType("scan");
                  setFile(null);
                  setFileData(null);
                }
}
                className={`flex-1 py-2 px-1 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${inputType === "scan" ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20" : isDarkMode ? "text-[#A1A194] hover:text-[#E0E0D5]" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Camera size={12} /> Scan Page
              </button>
            </div>

            {/* Tab Contents */}
            {inputType === "upload" && (
              <div className="space-y-2.5">
                <div className="flex items-stretch gap-2">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingUpload(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingUpload(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingUpload(false);
                      const droppedFile = e.dataTransfer?.files?.[0];
                      if (droppedFile) void handleUploadFile(droppedFile, "Drag & Drop Digital Upload");
                    }}
                    className={`min-w-0 flex-1 border-2 border-dashed rounded-xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                      isDraggingUpload
                        ? "border-sky-500 bg-sky-500/10 scale-[1.01]"
                        : isDarkMode
                        ? "border-[#4A4A3F] bg-[#22221F] hover:bg-[#2A2A26] hover:border-sky-500/60"
                        : "border-sky-300/90 bg-gradient-to-b from-white to-sky-50/50 hover:bg-sky-50/80 hover:border-sky-500"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shadow-2xs ${
                      isDarkMode ? "bg-[#383832] text-sky-400" : "bg-sky-100 text-sky-700"
                    }`}>
                      <Upload size={14} />
                    </div>
                    <span className={`text-[11px] font-bold leading-tight ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
                      Upload Document
                    </span>
                    <span className="text-[9px] text-[#8A8A7A] mt-0.5 truncate max-w-[155px]">
                      {file ? file.name : "Browse or drop file"}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5">
                      {["PDF", "DOCX", "PPTX", "TXT", "IMG"].map((fmt) => (
                        <span
                          key={fmt}
                          className={`px-1 py-0.5 rounded text-[7px] font-extrabold uppercase tracking-wider ${
                            isDarkMode
                              ? "bg-[#2E2E29] text-[#C2C2B0] border border-[#45453B]"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                </div>

                {/* Active Digital Document File Card in Upload System */}
                {(file || fileData) && (
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isDarkMode
                      ? "bg-[#282824] border-emerald-500/30"
                      : "bg-emerald-50/70 border-emerald-200/90"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white">
                            <CheckCircle2 size={10} /> Active File
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isDarkMode
                              ? "bg-[#22221F] border-[#383832] text-sky-300"
                              : "bg-white border-emerald-200 text-emerald-800"
                          }`}>
                            {getDigitalFileFormatBadge(file?.name || fileData?.mimeType)}
                          </span>
                        </div>
                        <p className={`text-xs font-bold truncate mt-1.5 ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
                          {file?.name || digitalScanReport?.documentTitle || "Uploaded Digital Document"}
                        </p>
                        <p className="text-[10px] text-[#8A8A7A] mt-0.5">
                          {formatDigitalFileSize(file?.size)}
                          {digitalScanReport ? ` • ${digitalScanReport.pageCount} Pages • ${digitalScanReport.wordCount.toLocaleString()} Words` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={downloadActiveDigitalDocumentFile}
                          title="Download Digital Document File"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDarkMode
                              ? "border-[#45453B] bg-[#22221F] text-sky-300 hover:bg-[#383832]"
                              : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setFileData(null);
                            setDigitalScanReport(null);
                            setScannedDigitalText("");
                            setGeneratedFunctionsCache({});
                          }}
                          disabled={loading}
                          aria-label="Remove uploaded file"
                          title="Remove uploaded file"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                            isDarkMode
                              ? "border-[#45453B] bg-[#22221F] text-red-300 hover:bg-red-950/40"
                              : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Suggestions for Uploaded Book in Left Sidebar */}
                {(file || fileData) && (
                  <UploadedBookSuggestionsPanel
                    bookTitle={file?.name || digitalScanReport?.documentTitle || "Uploaded Study Book"}
                    scanReport={digitalScanReport}
                    detectedUnits={detectedUnits}
                    activeFocusArea={activeScanFocusTopic}
                    onSelectFocusArea={(topic) => {
                      setActiveScanFocusTopic(topic);
                      setFocusArea(topic);
                    }}
                    onRunSuggestion={(action) => void handleRunUploadedBookSuggestion(action)}
                    isGenerating={loading}
                    generatingType={generatingType}
                    generatedFunctionsList={Object.keys(generatedFunctionsCache)}
                    isDarkMode={isDarkMode}
                    compact
                  />
                )}

                {/* Paste / Create Digital Document File Button */}
                <button
                  type="button"
                  onClick={() => setShowCreateDigitalDocModal(true)}
                  disabled={loading}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-950/50"
                      : "border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  <FileText size={14} /> Paste / Create Digital Document File
                </button>

                {fileData && (
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => void convertDocumentSameToSameHandwriting()}
                      disabled={loading}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading && generatingType === "verbatim-handwriting" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileText size={14} />
                      )}
                      <span>✍️ Convert Same-to-Same in Handwriting</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDigitalScannerHub(true);
                        if (!digitalScanReport) {
                          void scanDigitalDocument(fileData.fileUri, fileData.mimeType, file?.name, false);
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles size={14} /> Open Digital Scanner & 15 Functions
                    </button>
                    <button
                      type="button"
                      onClick={() => runEasyOCR(file || undefined)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-[11px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <ScanText size={13} /> Run EasyOCR & Digital Text Inspector
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDriveUpload}
                  disabled={!drivePickerReady || loading || isPickingDrive}
                  aria-label="Choose a book from Google Drive"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${isDarkMode ? "border-[#4A4A3F] bg-[#22221F] text-[#E0E0D5] hover:bg-[#2A2A26]" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"}`}
                >
                  {isPickingDrive ? <Loader2 size={15} className="animate-spin" /> : <HardDrive size={15} />}
                  {isPickingDrive ? "Connecting to Google Drive…" : drivePickerFailed ? "Google Drive unavailable" : drivePickerReady ? "Choose from Google Drive" : "Preparing Google Drive…"}
                </button>
                {drivePickerFailed && <p className="text-[10px] text-amber-700 dark:text-amber-300">Could not load Google Drive. Refresh the page and try again.</p>}
              </div>)}

            {false && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery ?? ""}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-[#FAF9F6] border border-[#D1D1C4] rounded-xl pl-8 pr-3 py-2 text-[#3A3A2F] outline-none focus:border-[#5A5A40] transition-all font-sans"
                  />
                  <span className="absolute left-2.5 top-2.5 text-[#8A8A7A]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </span>
                </div>

                {/* Department Filters Tab List */}
                <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
                  {["All", "MCA", "BCA", "Engineering", "Pharmacy", "Commerce", "Science", "Arts"].map((dept) => {
                    const isActive = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all shrink-0 border ${isActive ? "bg-[#5A5A40] border-[#5A5A40] text-white" : "bg-[#FAF9F6] border-[#E0E0D5] text-[#6A6A5A] hover:bg-[#E8E8E0]"}`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>

                {/* Books Display Grid */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {allLibraryBooks.filter(bk => {
                    if (selectedDept !== "All" && bk.department !== selectedDept) return false;

                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      return bk.title.toLowerCase().includes(q) || bk.author.toLowerCase().includes(q) || (bk.desc && bk.desc.toLowerCase().includes(q));
                    }

                    return true;
                  }).length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8A8A7A] bg-[#FAF9F6] rounded-xl border border-dashed border-[#D1D1C4]">
                      No books found in this category.
                    </div>
                  ) : (
                    allLibraryBooks.filter(bk => {
                      if (selectedDept !== "All" && bk.department !== selectedDept) return false;

                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        return bk.title.toLowerCase().includes(q) || bk.author.toLowerCase().includes(q) || (bk.desc && bk.desc.toLowerCase().includes(q));
                      }

                      return true;
                    }).map((bk) => {
                      const isSelected = fileData?.fileUri === bk.id || ((bk as any).fileUri && fileData?.fileUri === (bk as any).fileUri);
                      
                      // Department soft color tag
                      let tagColor = "bg-gray-100 text-gray-700 border-gray-200";
                      switch (bk.department) {
                        case "MCA": tagColor = "bg-[#E2F0D9] text-[#385723] border-[#C5E0B4]"; break;
                        case "BCA": tagColor = "bg-[#FFF2CC] text-[#7F6000] border-[#FFE699]"; break;
                        case "Engineering": tagColor = "bg-[#DDEBF7] text-[#1F4E79] border-[#BDD7EE]"; break;
                        case "Pharmacy": tagColor = "bg-[#F2F2F2] text-[#595959] border-[#D9D9D9]"; break;
                        case "Commerce": tagColor = "bg-[#E2EFDA] text-[#375623] border-[#C6E0B4]"; break;
                        case "Science": tagColor = "bg-[#E1D5E7] text-[#4C0099] border-[#D5E8D4]"; break;
                        case "Arts": tagColor = "bg-[#FFF2CC] text-[#7F3F00] border-[#FFF2CC]"; break;
                        default: tagColor = "bg-blue-50 text-blue-800 border-blue-200";
                      }

                      return (
                        <div
                          key={bk.id}
                          className={`p-3 bg-[#FAF9F6] rounded-xl border transition-all text-left flex flex-col justify-between gap-2.5 relative ${isSelected ? "border-[#5A5A40] ring-1 ring-[#5A5A40] bg-[#FAF9F0]" : "border-[#E0E0D5] hover:border-[#5A5A40]"}`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tagColor}`}>
                                {bk.department}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-[#3A3A2F] mt-1 leading-snug line-clamp-2">
                              {bk.title}
                            </h4>
                            <p className="text-[10px] text-[#8A8A7A] mt-0.5">
                              By {bk.author}
                            </p>
                            {bk.desc && (
                              <p className="text-[10px] text-[#6A6A5A] mt-1.5 leading-relaxed line-clamp-3 italic">
                                "{bk.desc}"
                              </p>
                            )}
                          </div>

                          <div className="flex gap-1.5 items-center mt-1">
                            <button
                              onClick={() => {
                                setFileData({ fileUri: (bk as any).fileUri || bk.id, mimeType: (bk as any).mimeType || "text/plain" });
                                setFile(new File([], `[Library Book] ${bk.title}`));
                                setResultText("");
                                setResultType("");
                                setFlashcards([]);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${isSelected ? "bg-[#5A5A40] text-white shadow-sm" : "border border-[#5A5A40] text-[#5A5A40] hover:bg-[#FAF9F0]"}`}
                            >
                              {isSelected ? "📖 Selected for Study" : "📖 Study Book"}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const textContent = `
=========================================
STUDY BOOK COMPANION: ${bk.title.toUpperCase()}
Author: ${bk.author}
Department: ${bk.department}
=========================================

Description:
${bk.desc || 'No description available.'}

This study companion has been successfully downloaded from your Notivexa AI Portal! You can upload it to the study panel anytime to generate notes, assessment tests, presentations, syllabus plans, and study guides.
                                `;
                                const blob = new Blob([textContent], { type: "text/plain" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${bk.title.replace(/[^a-zA-Z0-9]/g, "_")}_Companion.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className="py-1.5 px-2 border border-[#8A8A7A] text-[#8A8A7A] hover:text-[#5A5A40] hover:border-[#5A5A40] rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 shrink-0"
                              title="Download study companion text"
                            >
                              <Download size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {inputType === "scan" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsScannerOpen(true);
                    startCamera();
                  }
}
                  className="w-full bg-[#5A5A40] hover:bg-opacity-90 text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Camera size={14} /> Open Live Page Scanner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (file && (file.type.startsWith("image/") || file.name.match(/\.(png|jpe?g|webp)$/i))) {
                      runEasyOCR(file);
                    } else {
                      setIsScannerOpen(true);
                      startCamera();
                    }
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ScanText size={14} /> EasyOCR Framework (CRAFT + ResNet)
                </button>
                {file && file.name.startsWith("scan-") && (
                  <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E0E0D5] text-left flex items-center justify-between">
                    <div className="overflow-hidden mr-2">
                      <p className="text-[9px] font-bold text-[#5A5A40] uppercase tracking-wider">Active Scan</p>
                      <p className="text-xs text-[#3A3A2F] truncate mt-0.5">{file.name}</p>
                    </div>
                    <button
                      onClick={() => { setFile(null); setFileData(null); }}
                      className="text-[#8A8A7A] hover:text-[#5A5A40] p-1 rounded-full hover:bg-[#F0F0E8] transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>)}
              </div>)}
          </div>



          {/* Actions */}
          <div id="learning-tools" className="scroll-mt-6">
            <label className="text-xs font-semibold text-[#8A8A7A] uppercase tracking-widest mb-3 block">
              Actions
            </label>
            
            <div className="space-y-3">
              {mode === "student" ? (
                <>
                  {/* DEDICATED FUNCTION: Same-to-Same Uploaded Document -> Realistic Student Handwriting Pages (Exact 1:1 Verbatim Copy, Not Notes) */}
                  <div className={`p-3.5 rounded-2xl space-y-2.5 shadow-sm border transition-colors ${
                    isDarkMode
                      ? "bg-[#242631] border-blue-500/40"
                      : "bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-violet-50/50 border-blue-300/90 shadow-blue-500/10"
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <FileText size={15} />
                        </div>
                        <div>
                          <span className={`font-serif text-sm font-bold block leading-tight ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                            Same-to-Same Handwriting
                          </span>
                          <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold block">
                            Exact 1:1 Uploaded Document (Not Notes)
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                        Exact 1:1
                      </span>
                    </div>

                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>
                      Converts your uploaded document word-for-word, same-to-same as uploaded directly into realistic student handwriting A4 pages without summarizing into notes.
                    </p>

                    <div className="grid grid-cols-1 gap-1.5">
                      {fileData ? (
                        <div className="grid grid-cols-1 gap-1.5">
                          <button
                            type="button"
                            onClick={() => void convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, false)}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            {loading && generatingType === "verbatim-handwriting" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <FileText size={14} />
                            )}
                            <span>Convert Current Doc Same-to-Same</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, true)}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            {loading && generatingType === "handwritten-table-form" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                            <span>📊 Convert Current Doc in Table Form</span>
                          </button>
                        </div>
                      ) : null}

                      <label
                        className={`w-full py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isDarkMode
                            ? "border-blue-500/40 bg-[#1E202B] text-blue-300 hover:bg-[#282B3A]"
                            : "border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        <Upload size={13} />
                        <span>Upload Document for 1:1 Handwriting</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                          className="hidden"
                          onChange={handleUploadAndConvertVerbatim}
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-1.5">
                        <label
                          title="Upload a table file (.XLSX, .CSV, .TSV, .DOCX, .PDF, or Table Image) to convert into Handwritten Table Form"
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isDarkMode
                              ? "border-teal-500/40 bg-teal-950/30 text-teal-300 hover:bg-teal-950/50"
                              : "border-teal-300 bg-teal-50/80 text-teal-800 hover:bg-teal-100"
                          }`}
                        >
                          <Upload size={12} />
                          <span>📊 Upload Table File</span>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv,.tsv,.docx,.doc,.pdf,.json,.html,.htm,image/*"
                            className="hidden"
                            onChange={handleUploadAndConvertTable}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowTableUploadModal(true)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isDarkMode
                              ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-950/50"
                              : "border-indigo-300 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100"
                          }`}
                        >
                          <FileText size={12} />
                          <span>Table Form Grid</span>
                        </button>
                      </div>

                      {resultText && resultType === "verbatim-handwriting" && (
                        <button
                          type="button"
                          onClick={() => downloadHandwrittenPDF(false)}
                          disabled={isExporting}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isExporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                          <span>Download Same-to-Same Handwritten PDF</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DEDICATED FUNCTION: Handwriting Notes (Chapter & Unit Wise) */}
                  <div className={`p-3.5 rounded-2xl space-y-3 shadow-sm border transition-colors ${
                    isDarkMode
                      ? "bg-[#282824] border-[#383832]"
                      : "bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-100/30 border-amber-300/80 shadow-amber-500/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <BookOpen size={15} />
                        </div>
                        <div>
                          <span className={`font-serif text-sm font-bold block leading-tight ${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}`}>
                            Handwriting Notes
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                            Chapter & Unit Wise Notes
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300/70">
                        Full A4
                      </span>
                    </div>

                    {/* Unit Selector */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>
                          Choose Unit
                        </label>
                        {fileData && (
                          <button
                            type="button"
                            onClick={detectChaptersFromDoc}
                            disabled={isDetectingChapters || loading}
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                          >
                            {isDetectingChapters ? <Loader2 size={10} className="animate-spin" /> : "🔍 Auto-Detect"}
                          </button>
                        )}
                      </div>
                      <select
                        value={selectedUnit}
                        onChange={(e) => {
                          setSelectedUnit(e.target.value);
                          if (e.target.value !== "custom") setCustomUnitTitle("");
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-xs focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-medium ${
                          isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"
                        }`}
                      >
                        <option value="all">All Units (Complete Syllabus)</option>
                        {detectedUnits.length > 0 ? (
                          detectedUnits.map((u) => (
                            <option key={u.unit} value={u.unit}>
                              {u.unit}: {u.title}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Unit 1">Unit 1: Foundations & Architecture</option>
                            <option value="Unit 2">Unit 2: Core Algorithms & Models</option>
                            <option value="Unit 3">Unit 3: Implementation & Analysis</option>
                            <option value="Unit 4">Unit 4: Advanced Mechanisms & Systems</option>
                            <option value="Unit 5">Unit 5: Case Studies & Applications</option>
                            <option value="Unit 6">Unit 6: Special Topics & Trends</option>
                          </>
                        )}
                        <option value="custom">Custom Unit...</option>
                      </select>
                      {selectedUnit === "custom" && (
                        <input
                          type="text"
                          placeholder="Type Unit Name (e.g. Unit 3: Dynamic Programming)"
                          value={customUnitTitle}
                          onChange={(e) => setCustomUnitTitle(e.target.value)}
                          className={`w-full mt-1 px-2.5 py-1.5 rounded-xl border text-xs outline-none ${
                            isDarkMode ? "bg-[#22221F] border-[#383832] text-white" : "bg-white border-amber-300 text-slate-800"
                          }`}
                        />
                      )}
                    </div>

                    {/* Chapter Selector */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>
                        Choose Chapter
                      </label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => {
                          setSelectedChapter(e.target.value);
                          if (e.target.value !== "custom") setCustomChapterTitle("");
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-xs focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-medium ${
                          isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"
                        }`}
                      >
                        <option value="all">All Chapters in Unit</option>
                        {detectedUnits.length > 0 && selectedUnit !== "all" && selectedUnit !== "custom" &&
                         detectedUnits.find((u) => u.unit === selectedUnit)?.chapters?.length ? (
                          detectedUnits
                            .find((u) => u.unit === selectedUnit)!
                            .chapters.map((c) => (
                              <option key={c.chapter} value={`${c.chapter}: ${c.title}`}>
                                {c.chapter}: {c.title}
                              </option>
                            ))
                        ) : (
                          <>
                            <option value="Chapter 1">Chapter 1: Introduction & Principles</option>
                            <option value="Chapter 2">Chapter 2: Core Theory & Workflows</option>
                            <option value="Chapter 3">Chapter 3: Equations & Mathematical Models</option>
                            <option value="Chapter 4">Chapter 4: Comparative Derivations & Schematics</option>
                            <option value="Chapter 5">Chapter 5: University Exam Q&A</option>
                            <option value="Chapter 6">Chapter 6: Practical Applications</option>
                          </>
                        )}
                        <option value="custom">Custom Chapter...</option>
                      </select>
                      {selectedChapter === "custom" && (
                        <input
                          type="text"
                          placeholder="Type Chapter Name (e.g. Chapter 4: Divide and Conquer)"
                          value={customChapterTitle}
                          onChange={(e) => setCustomChapterTitle(e.target.value)}
                          className={`w-full mt-1 px-2.5 py-1.5 rounded-xl border text-xs outline-none ${
                            isDarkMode ? "bg-[#22221F] border-[#383832] text-white" : "bg-white border-amber-300 text-slate-800"
                          }`}
                        />
                      )}
                    </div>

                    {/* Note Depth Target */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-bold ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>
                        Handwritten Note Depth
                      </label>
                      <select
                        value={noteDepthTarget}
                        onChange={(e) => setNoteDepthTarget(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none font-medium ${
                          isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"
                        }`}
                      >
                        <option value={52}>50+ Full A4 Pages (Master Notebook)</option>
                        <option value={25}>25+ Full A4 Pages (Detailed Study)</option>
                        <option value={15}>15+ Full A4 Pages (High-Yield Quick Revision)</option>
                      </select>
                    </div>

                    {/* Quick Pen Color Switcher */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className={`text-[11px] font-bold ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>
                        Pen Style
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPenColor("blue")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            penColor === "blue"
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : isDarkMode ? "bg-[#22221F] border-[#383832] text-slate-300" : "bg-white border-slate-200 text-slate-700"
                          }`}
                          title="Black Pen Headings + Blue Pen Sentences"
                        >
                          ✒️ Blue Pen
                        </button>
                        <button
                          type="button"
                          onClick={() => setPenColor("black")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            penColor === "black"
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : isDarkMode ? "bg-[#22221F] border-[#383832] text-slate-300" : "bg-white border-slate-200 text-slate-700"
                          }`}
                          title="Blue Pen Headings + Black Pen Sentences"
                        >
                          ✒️ Black Pen
                        </button>
                      </div>
                    </div>

                    {/* Action: Generate Handwriting Notes */}
                    <button
                      onClick={() => generateHandwritingNotes()}
                      disabled={!fileData || loading}
                      className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
                    >
                      {loading && generatingType === "notes" ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <BookOpen size={15} />
                      )}
                      <span>
                        Generate Handwriting Notes
                        {selectedUnit !== "all" || selectedChapter !== "all"
                          ? ` (${selectedUnit !== "all" ? selectedUnit : ""} ${selectedChapter !== "all" ? selectedChapter : ""})`
                          : " (50+ Pages)"}
                      </span>
                    </button>

                    {/* Action: Easy Download PDF */}
                    {resultText && resultType === "notes" && (
                      <button
                        type="button"
                        onClick={() => downloadHandwrittenPDF(false)}
                        disabled={isExporting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isExporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                        <span>Download Chapter Notes (PDF)</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => generateNotes("all", "all")}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 active:scale-[0.99]"
                  >
                    {loading && generatingType === "notes" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                    Complete Book Summary (All Topics)
                  </button>
                  <button
                    onClick={() => {
                      if (!fileData) return;
                      setShowLessonPlanGuidanceModal(true);
                    }}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {loading && generatingType === "lesson-plan" ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                    Generate Study Lesson Planner
                  </button>
                  <button
                    onClick={generateFlashcards}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "flashcards" ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                    Generate Flashcards
                  </button>
                  <div className={`p-3 rounded-2xl space-y-2.5 shadow-sm mt-2 border transition-colors ${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/40 border-emerald-200/90 shadow-emerald-500/5"}`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>
                        <GraduationCap size={18} className="text-[#059669]" />
                        <span className={`font-serif text-sm font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}`}>
                          Exam Paper & Question Bank
                        </span>
                      </div>
                    </div>
                    
                                        <div className="space-y-2">
                        <div role="group" aria-label="Choose assessment tool" className={`grid grid-cols-2 rounded-xl p-1 ${isDarkMode ? "bg-[#22221F]" : "bg-white/80"}`}>
                          <button
                            type="button"
                            onClick={() => setActiveExamTool("question-bank")}
                            aria-pressed={activeExamTool === "question-bank"}
                            className={`rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${activeExamTool === "question-bank" ? "bg-emerald-600 text-white shadow-sm" : isDarkMode ? "text-[#A1A194] hover:text-white" : "text-slate-600 hover:bg-slate-100"}`}
                          >
                            Question Bank
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveExamTool("exam-paper")}
                            aria-pressed={activeExamTool === "exam-paper"}
                            className={`rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${activeExamTool === "exam-paper" ? "bg-blue-600 text-white shadow-sm" : isDarkMode ? "text-[#A1A194] hover:text-white" : "text-slate-600 hover:bg-slate-100"}`}
                          >
                            Exam Paper
                          </button>
                        </div>
                        {activeExamTool === "question-bank" && (
                      <div className="p-2.5 rounded-xl border border-[#D1D1C4] dark:border-[#383832] space-y-2">
                        <label className={`block text-xs font-semibold ${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}`}>
                          Question Bank Generator
                        </label>
                        <select 
                          value={questionBankType} 
                          onChange={(e) => setQuestionBankType(e.target.value)}
                          className={`w-full px-2.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-[#059669]/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                        >
                          <option value="all">All Types (MCQs, 5M Short + Diagrams, 10M Long)</option>
                          <option value="mcq">Multiple Choice (50+ MCQs)</option>
                          <option value="short">Short Answer (Min 5 Marks • 2 A4 Pages + Diagram)</option>
                          <option value="long">Long Answer (10 Marks • Deep Solutions)</option>
                        </select>
                        <button
                          onClick={() => void generateQuestionBank()}
                          disabled={!fileData || loading}
                          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loading && generatingType === "question-bank" ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                          Generate Question Bank
                        </button>
                      </div>
                        )}
                        {activeExamTool === "exam-paper" && (
                      <div className="p-2.5 rounded-xl border border-[#D1D1C4] dark:border-[#383832] space-y-2 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10">
                        <label className={`block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400`}>
                          Exam Question Paper
                        </label>
                        <select 
                          value={examPaperType} 
                          onChange={(e) => setExamPaperType(e.target.value)}
                          className={`w-full px-2.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                        >
                          <option value="paper-full">Full Paper (MCQs, 5M Short + Diagrams, 10M Long)</option>
                          <option value="paper-mcq">MCQ Paper (1 Mark each)</option>
                          <option value="paper-short">Short Q's Paper (Min 5 Marks • 2 A4 Pages + Diagram)</option>
                          <option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                          <option value="paper-university">University Format (CO/BT Mapped)</option>
                        </select>
                        {examPaperType === "paper-university" && (
                          <div className="mt-2">
                            <label className={`block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1`}>
                              Total Marks
                            </label>
                            <select
                              value={universityMarks}
                              onChange={(e) => setUniversityMarks(Number(e.target.value))}
                              className={`w-full px-2.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                            >
                              <option value={10}>10 Marks</option>
                              <option value={20}>20 Marks</option>
                              <option value={50}>50 Marks</option>
                              <option value={60}>60 Marks</option>
                              <option value={75}>75 Marks</option>
                              <option value={80}>80 Marks</option>
                              <option value={100}>100 Marks</option>
                            </select>
                          </div>
                        )}
                        <button
                          onClick={generateExamPaper}
                          disabled={!fileData || loading}
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loading && generatingType === "exam-paper" ? <Loader2 size={14} className="animate-spin" /> : <FileQuestion size={14} />}
                          Generate Exam Paper
                        </button>
                      </div>
                        )}
                    </div>
                  </div>
                  <button
                    onClick={generatePPT}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-700 hover:to-rose-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "ppt" ? <Loader2 size={16} className="animate-spin" /> : <Presentation size={16} />}
                    Generate PPT
                  </button>
                  <button
                    onClick={generateVideoExplanation}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 hover:from-violet-700 hover:to-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "video" ? <Loader2 size={16} className="animate-spin" /> : <FileVideo size={16} />}
                    Generate Smart Video Lecture
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={generateAssessment}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "assessment" ? <Loader2 size={16} className="animate-spin" /> : <FileQuestion size={16} />}
                    Create Question Paper
                  </button>
                  <button
                    onClick={() => {
                      if (!fileData) return;
                      setShowLessonPlanGuidanceModal(true);
                    }}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {loading && generatingType === "lesson-plan" ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                    Create Study Lesson Planner
                  </button>
                  <button
                    onClick={generatePPT}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-700 hover:to-rose-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "ppt" ? <Loader2 size={16} className="animate-spin" /> : <Presentation size={16} />}
                    Generate PPT
                  </button>
                  <button
                    onClick={generateVideoExplanation}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 hover:from-violet-700 hover:to-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "video" ? <Loader2 size={16} className="animate-spin" /> : <FileVideo size={16} />}
                    Generate Smart Video Lecture
                  </button>

                </>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
      {/* Main Content Area */}
      <div className="relative z-10 min-w-0 overflow-auto bg-transparent p-2 sm:p-4 lg:p-6 transition-colors duration-300">
        {/* Quick Bar when Sidebar is Minimized */}
        {!isSidebarOpen && (
          <div className={`flex items-center justify-between gap-2 mb-3 p-2 rounded-xl border shadow-xs ${
            isDarkMode ? "bg-[#22221F]/95 border-[#383832]" : "bg-white/95 border-sky-200/80"
          }`}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Show Study Sidebar</span>
            </button>
            <label className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              isDarkMode ? "border-sky-500/40 bg-sky-950/40 text-sky-300" : "border-sky-200 bg-sky-50 text-sky-700"
            }`}>
              <Upload size={13} />
              <span>Upload File</span>
              <input
                type="file"
                accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>
        )}

        <Chatbot fileUri={fileData?.fileUri} mimeType={fileData?.mimeType} isDarkMode={isDarkMode} embedded={false} onOpenChange={setIsChatbotOpen} />
        <div id="learning-content" className={`${!resultText && !flashcards.length && !videoData && !slides.length ? "max-w-none" : "max-w-4xl"} mx-auto space-y-5 sm:space-y-8 relative z-10 scroll-mt-6`}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[24px] p-6 flex gap-4 items-start relative shadow-sm text-sm"
            >
              <div className="bg-[#FEE2E2] p-2 rounded-xl text-[#EF4444] shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-[#991B1B] text-base mb-1">Process Warning</h4>
                <p className="text-[#B91C1C] leading-relaxed font-sans mb-4">{error}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {lastActionRef.current ? (
                    <button
                      onClick={async () => {
                        const action = lastActionRef.current;
                        setError(null);
                        if (action) await action();
                      }}
                      disabled={loading}
                      className="bg-[#EF4444] text-white hover:bg-[#DC2626] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                      Try Again Now
                    </button>
                  ) : (
                    <button
                      onClick={() => setError(null)}
                      className="bg-[#EF4444] text-white hover:bg-[#DC2626] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs cursor-pointer shadow-sm"
                    >
                      <RefreshCw size={14} />
                      Continue Working
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-white text-[#EF4444] border border-[#FCA5A5] hover:bg-[#FEE2E2] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={14} />
                    Reload Portal
                  </button>
                  <a
                    href={typeof window !== "undefined" ? window.location.href : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs cursor-pointer shadow-sm"
                  >
                    <ExternalLink size={14} />
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => setError(null)}
                    className="bg-transparent text-[#991B1B] hover:bg-[#FEE2E2] px-3 py-2 rounded-xl font-medium transition-colors text-xs cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-[#991B1B] hover:bg-[#FEE2E2] p-2 rounded-full transition-colors absolute top-4 right-4 cursor-pointer"
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </motion.div>)}

          {activeNav === "storage" ? (
            <div id="user-storage-vault">
              <UserStorageVaultPanel
                userKey={userStorageKey}
                userEmail={user?.email || (isQuickGuest ? "Primary Workspace Profile" : undefined)}
                isDarkMode={isDarkMode}
                personalLibraryBooks={personalLibraryBooks}
                onOpenStudyItem={(item) => handleSelectHistoryItem(item)}
                onOpenUploadedDocument={(docMeta) => void handleOpenStoredUploadFromVault(docMeta)}
                onOpenLibraryBook={(book) => void handleStudyLibraryBook(book)}
                onSaveCurrentWorkspaceNow={handleSaveCurrentWorkspaceToVault}
                onUploadFileToStorage={(uploadedFile) => handleUploadFile(uploadedFile, "User Storage Vault (3GB)")}
                onVaultChanged={() => setStorageRefreshTick((t) => t + 1)}
              />
            </div>
          ) : activeNav === "library" ? (
            <LibraryPanel
              books={allLibraryBooks}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedDepartment={selectedDept}
              onDepartmentChange={setSelectedDept}
              selectedFileUri={fileData?.fileUri}
              isDarkMode={isDarkMode}
              onStudyBook={handleStudyLibraryBook}
              onStudyBookWithAction={(book, action) => handleStudyLibraryBook(book, action)}
              onDownloadBook={handleDownloadLibraryBook}
              onAddBookLink={handleAddBookLink}
              onAddLocalBook={handleAddLocalBook}
              onRemoveBook={handleRemoveLibraryBook}
              busyBookId={busyLibraryBookId}
            />
          ) : (
          <>
          {/* Scanned Digital Document Bar & Generated Multi-Functions Switcher */}
          {fileData && (
            <div className={`mb-5 rounded-2xl border p-3.5 shadow-sm transition-all ${
              isDarkMode ? "border-[#383832] bg-[#22221F]/95" : "border-indigo-200/80 bg-white/95"
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600 text-white shadow-sm">
                    <ScanText size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-black truncate max-w-xs sm:max-w-md ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                        {digitalScanReport?.documentTitle || file?.name || "Scanned Digital Document"}
                      </span>
                      {digitalScanReport && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {digitalScanReport.pageCount} Pages • {digitalScanReport.wordCount.toLocaleString()} Words • {digitalScanReport.detectedTopics?.length || 0} Topics
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                      Digital Document Scanner Ready — Switch between the 14-Function Scanner Hub and generated outputs anytime.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    title="Upload a new Digital Document File"
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode
                        ? "border-sky-500/30 bg-sky-950/30 text-sky-300 hover:bg-sky-950/50"
                        : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                    }`}
                  >
                    <Upload size={13} />
                    <span>Upload New Digital File</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={downloadActiveDigitalDocumentFile}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode
                        ? "border-[#45453B] bg-[#2A2A26] text-[#E0E0D5] hover:bg-[#383832]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                    title="Download Active Digital Document File"
                  >
                    <Download size={13} />
                    <span>Download Digital File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, false)}
                    disabled={loading}
                    title="Convert uploaded document same-to-same (exact 1:1 verbatim copy, not study notes) into realistic student handwriting A4 pages"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading && generatingType === "verbatim-handwriting" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <FileText size={13} />
                    )}
                    <span>✍️ Same-to-Same Handwritten Pages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void convertDocumentSameToSameHandwriting(undefined, undefined, undefined, undefined, true)}
                    disabled={loading}
                    title="Convert uploaded table or document into realistic student handwritten A4 Table Form"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading && generatingType === "handwritten-table-form" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    <span>📊 Handwritten Table Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTableUploadModal(true)}
                    disabled={loading}
                    title="Upload a table file (.XLSX, .CSV, .DOCX, .PDF) or build/paste a table in Table Form"
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode
                        ? "border-teal-500/40 bg-teal-950/30 text-teal-300 hover:bg-teal-950/50"
                        : "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                    }`}
                  >
                    <Upload size={13} />
                    <span>Upload / Build Table</span>
                  </button>

                  {resultText && (
                    <button
                      type="button"
                      onClick={() => void downloadHandwrittenPDF(true)}
                      disabled={isExporting}
                      title="Fast Download the exact same pages shown in the Google AI Studio interface as PDF"
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isExporting ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <FileDown size={13} />
                      )}
                      <span>⚡ Fast Download Same Pages (PDF)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowDigitalScannerHub((prev) => !prev)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      showDigitalScannerHub
                        ? "bg-indigo-600 text-white shadow-sm"
                        : isDarkMode
                        ? "bg-[#2E2E29] text-indigo-300 border border-indigo-500/30 hover:bg-[#383832]"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                    }`}
                  >
                    <Sparkles size={13} />
                    {showDigitalScannerHub ? "Hide Scanner Hub" : "Open 15-Function Scanner Hub"}
                  </button>

                  <button
                    type="button"
                    onClick={() => runEasyOCR(file || undefined)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode
                        ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <ScanText size={13} /> EasyOCR Inspector
                  </button>
                </div>
              </div>

              {/* Generated Functions Quick Switcher Pills */}
              {Object.keys(generatedFunctionsCache).length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-[#383832] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                    Generated Outputs ({Object.keys(generatedFunctionsCache).length}):
                  </span>
                  {Object.entries(generatedFunctionsCache).map(([funcKey, cachedItem]) => {
                    const isCurrent =
                      !showDigitalScannerHub &&
                      ((cachedItem.resultType && resultType === cachedItem.resultType && resultText === cachedItem.resultText) ||
                        (funcKey === "flashcards" && flashcards.length > 0 && !resultText));
                    return (
                      <button
                        key={funcKey}
                        type="button"
                        onClick={() => {
                          setShowDigitalScannerHub(false);
                          if (funcKey === "flashcards" && cachedItem.flashcards) {
                            setGeneratedFlashcards(cachedItem.flashcards);
                            setResultText("");
                            setCurrentCardIndex(0);
                            setIsFlipped(false);
                          } else if (cachedItem.resultText) {
                            setGeneratedResultText(cachedItem.resultText);
                            setResultType((cachedItem.resultType as any) || "notes");
                            setActiveMultiFunctionTitle(cachedItem.label);
                            setFlashcards([]);
                          }
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : isDarkMode
                            ? "bg-[#2A2A26] text-[#D5D5C8] hover:bg-[#383832]"
                            : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        ✓ {cachedItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Uploaded Book & Document Smart AI Suggestions Hub */}
          {fileData && (
            <UploadedBookSuggestionsPanel
              bookTitle={file?.name || digitalScanReport?.documentTitle || "Uploaded Study Book"}
              scanReport={digitalScanReport}
              detectedUnits={detectedUnits}
              activeFocusArea={activeScanFocusTopic}
              onSelectFocusArea={(topic) => {
                setActiveScanFocusTopic(topic);
                setFocusArea(topic);
              }}
              onRunSuggestion={(action) => void handleRunUploadedBookSuggestion(action)}
              onTriggerMultiFunction={(funcId) => void handleTriggerMultiFunction(funcId)}
              isGenerating={loading}
              generatingType={generatingType}
              generatedFunctionsList={Object.keys(generatedFunctionsCache)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Digital Document Scanner & Multi-Function Generator Hub */}
          {fileData && (showDigitalScannerHub || (!resultText && !flashcards.length && !videoData && !slides.length)) && (
            <div className="mb-6">
              <DigitalDocumentScannerHub
                fileName={file?.name || digitalScanReport?.documentTitle || "Uploaded Digital Document"}
                scanReport={digitalScanReport}
                extractedText={scannedDigitalText}
                isScanning={isScanningDigitalDoc}
                isGenerating={loading}
                generatingType={generatingType}
                isDarkMode={isDarkMode}
                activeFocusArea={activeScanFocusTopic}
                onSelectFocusArea={(topic) => {
                  setActiveScanFocusTopic(topic);
                  setFocusArea(topic);
                }}
                onRescanDocument={(deep) => void scanDigitalDocument(fileData.fileUri, fileData.mimeType, file?.name, Boolean(deep))}
                onRunEasyOCR={() => void runEasyOCR(file || undefined)}
                onTriggerFunction={(funcId) => void handleTriggerMultiFunction(funcId)}
                onBatchGenerateStudyPack={() => void handleBatchGenerateStudyPack()}
                isBatchGenerating={isBatchGenerating}
                batchProgressLabel={batchProgressLabel}
                generatedFunctionsList={Object.keys(generatedFunctionsCache)}
                onUploadNewDigitalFile={(newFile) => void handleUploadFile(newFile, "Digital Scanner Hub")}
                onOpenCreateDigitalDocModal={() => setShowCreateDigitalDocModal(true)}
                onOpenTableUploadModal={() => setShowTableUploadModal(true)}
                onUseScannedTextAsNotes={(txt) => {
                  setGeneratedResultText(txt);
                  setResultType("notes");
                  setActiveMultiFunctionTitle("Scanned Digital Document Text");
                  setShowDigitalScannerHub(false);
                }}
              />
            </div>
          )}

          {!fileData && !resultText && !flashcards.length && !videoData && (
            <div className="relative z-0 flex flex-col justify-start gap-3 sm:gap-5 overflow-hidden rounded-3xl bg-transparent py-1.5 sm:py-4">
              <div className="relative z-10 flex w-full flex-col items-center justify-center overflow-hidden px-3 sm:px-4 pt-1 sm:pt-2 pb-1 text-center">

                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: [0, -5, 0] }}
                          transition={{ opacity: { duration: 0.5 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                          className="relative z-10 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-700 text-white shadow-lg shadow-sky-900/15"
                        >
                  <BookOpen size={30} strokeWidth={1.5} />
                        </motion.div>

              <h2 className={`text-3xl md:text-4xl font-bold font-serif mb-2 tracking-tight ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                Welcome to <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Notivexa AI</span>
              </h2>
              <p className={`text-sm md:text-base max-w-2xl leading-relaxed ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
                Upload any Digital Document File to automatically scan chapters, formulas, and concepts and generate 14+ study & exam outputs.
              </p>

              </div>

              {/* HERO DIGITAL DOCUMENT FILE UPLOAD SYSTEM */}
              <div className="mx-auto w-full max-w-6xl px-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingUpload(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingUpload(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingUpload(false);
                    const droppedFile = e.dataTransfer?.files?.[0];
                    if (droppedFile) void handleUploadFile(droppedFile, "Main Digital Document Upload System");
                  }}
                  className={`rounded-3xl border-2 border-dashed p-6 sm:p-7 transition-all shadow-sm ${
                    isDraggingUpload
                      ? "border-sky-500 bg-sky-500/10 scale-[1.005]"
                      : isDarkMode
                      ? "border-[#45453B] bg-[#22221F]/95 hover:border-sky-500/50"
                      : "border-sky-300/90 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/40 hover:border-sky-500"
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-center">
                    {/* Left: Primary Digital Document Dropzone & File Picker */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs">
                          <Upload size={12} /> Digital Document File Upload System
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <ScanText size={12} /> Auto-Scans & Unlocks 14 AI Functions
                        </span>
                      </div>

                      <div>
                        <h3 className={`font-serif text-xl sm:text-2xl font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                          Add Your Digital Document File to Start Studying
                        </h3>
                        <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
                          Supports PDF textbooks, Microsoft Word (`.docx`), PowerPoint slides (`.pptx`), Excel/CSV sheets (`.xlsx`/`.csv`), Markdown/Text notes (`.md`/`.txt`), Rich Text (`.rtf`), HTML/JSON, and scanned page images.
                        </p>
                      </div>

                      {/* Supported Format Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { label: ".PDF E-Books", tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25" },
                          { label: ".DOCX Word", tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25" },
                          { label: ".PPTX Slides", tone: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25" },
                          { label: ".XLSX / .CSV", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25" },
                          { label: ".MD / .TXT / .RTF", tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25" },
                          { label: ".HTML / .JSON", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25" },
                          { label: "PNG / JPG OCR", tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25" },
                        ].map((fmt) => (
                          <span
                            key={fmt.label}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${fmt.tone}`}
                          >
                            {fmt.label}
                          </span>
                        ))}
                      </div>

                      {/* Primary Upload Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <label className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 hover:from-sky-700 hover:to-violet-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]">
                          {loading ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
                          <span>Choose Digital Document File</span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                            className="hidden"
                            onChange={handleUpload}
                          />
                        </label>

                        <label
                          title="Upload any document and immediately convert it same-to-same (exact 1:1 verbatim copy, not study notes) into realistic student handwriting A4 pages"
                          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-800 hover:to-purple-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          {loading && generatingType === "verbatim-handwriting" ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <FileText size={16} />
                          )}
                          <span>✍️ Upload for Same-to-Same Handwriting (1:1)</span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                            className="hidden"
                            onChange={handleUploadAndConvertVerbatim}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowTableUploadModal(true)}
                          disabled={loading}
                          title="Upload a table file (.XLSX, .CSV, .TSV, .DOCX, .PDF, Image) or enter/paste rows & columns in Table Form for Student Handwriting A4 Pages"
                          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <Sparkles size={16} />
                          <span>📊 Upload Table (Table Form Handwriting)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCreateDigitalDocModal(true)}
                          disabled={loading}
                          className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isDarkMode
                              ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-950/50"
                              : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                          }`}
                        >
                          <FileText size={16} />
                          <span>Paste / Create Digital File</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsScannerOpen(true);
                            startCamera();
                          }}
                          disabled={loading}
                          className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isDarkMode
                              ? "border-[#45453B] bg-[#2A2A26] text-[#E0E0D5] hover:bg-[#383832]"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Camera size={16} />
                          <span>Camera Scan</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: 1-Click Sample Digital Document Files to Test Immediately */}
                    <div className={`p-4 rounded-2xl border ${
                      isDarkMode ? "bg-[#2A2A26] border-[#383832]" : "bg-white/95 border-slate-200/90 shadow-xs"
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div>
                          <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? "text-sky-300" : "text-sky-700"}`}>
                            Ready-to-Scan Digital Document Files
                          </h4>
                          <p className={`text-[11px] ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                            Click any digital file below to load & scan it in 1 second:
                          </p>
                        </div>
                        <Sparkles size={16} className="text-indigo-500 shrink-0" />
                      </div>

                      <div className="space-y-2">
                        {SAMPLE_DIGITAL_DOCUMENTS.map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            disabled={loading}
                            onClick={() => void handleUploadDirectDigitalDoc(sample.fileName, sample.content, sample.format)}
                            className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer disabled:opacity-50 ${
                              isDarkMode
                                ? "bg-[#22221F] border-[#383832] hover:border-sky-500/50 hover:bg-[#2E2E29]"
                                : "bg-slate-50/70 border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/60"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold truncate ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
                                  {sample.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#8A8A7A] truncate block mt-0.5">
                                {sample.fileName} • 4 Units Indexed
                              </span>
                            </div>
                            <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-2xs group-hover:translate-x-0.5 transition-transform">
                              Load & Scan →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="mx-auto grid w-full max-w-6xl gap-4 px-4 lg:grid-cols-[1.1fr_1fr]"
              >
                <section className={`rounded-2xl border p-5 shadow-sm backdrop-blur-sm ${isDarkMode ? "border-[#383832] bg-[#22221F]/90" : "border-slate-200/80 bg-white/85"}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-semibold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>Recent study activity</h3>
                      <p className={`mt-1 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Pick up from your saved work.</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDarkMode ? "bg-[#383832] text-sky-300" : "bg-sky-50 text-sky-700"}`}>
                      <Clock size={17} />
                    </div>
                  </div>
                  {historyDeleteError && (
                    <p role="alert" className="mb-3 text-xs text-red-600">{historyDeleteError}</p>
                  )}
                  {historyLoading ? (
                    <div className={`flex items-center gap-2 py-5 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                      <Loader2 size={15} className="animate-spin" /> Loading saved study activity
                    </div>
                  ) : uniqueHistoryItems.length > 0 ? (
                    <div className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                      {uniqueHistoryItems.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSelectHistoryItem(item)}
                            className={`flex min-w-0 flex-1 items-center gap-3 py-1 text-left transition-colors ${isDarkMode ? "hover:text-sky-300" : "hover:text-sky-800"}`}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? "bg-[#383832] text-sky-300" : "bg-sky-50 text-sky-700"}`}>
                              <FileText size={15} />
                            </div>
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-xs font-semibold ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"}`}>{item.title}</span>
                              <span className={`mt-0.5 block text-[10px] capitalize ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>{item.type.replaceAll("-", " ")}</span>
                            </span>
                            <ArrowRight size={14} className="shrink-0 opacity-60" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => void handleDeleteHistoryItem(e, item.id)}
                            disabled={deletingHistoryId !== null}
                            aria-label={`Delete ${item.title} from study history`}
                            title="Delete from history"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "text-[#A1A194] hover:bg-red-950/40 hover:text-red-300" : "text-slate-400 hover:bg-red-50 hover:text-red-600"}`}
                          >
                            {deletingHistoryId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex min-h-24 flex-col items-start justify-center rounded-xl border border-dashed px-4 py-3 ${isDarkMode ? "border-[#45453B] bg-[#2A2A26]" : "border-slate-200 bg-slate-50/70"}`}>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>No saved activity yet.</p>
                    </div>
                  )}
                </section>

                <section className={`rounded-2xl border p-5 shadow-sm backdrop-blur-sm ${isDarkMode ? "border-[#383832] bg-[#22221F]/90" : "border-slate-200/80 bg-white/85"}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-semibold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>Study overview</h3>
                      <p className={`mt-1 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>A snapshot of your saved learning work.</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDarkMode ? "bg-[#383832] text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                      <Activity size={17} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Saved resources", value: uniqueHistoryItems.length, icon: FileText, tone: "sky" },
                      { label: "Note sets", value: savedNotesCount, icon: BookOpen, tone: "indigo" },
                      { label: "Practice sets", value: practiceSetsCount, icon: CheckCircle2, tone: "emerald" },
                      { label: "Study sources", value: studySourcesCount, icon: GraduationCap, tone: "amber" },
                    ].map(({ label, value, icon: Icon, tone }) => (
                      <div key={label} className={`flex min-h-24 items-center gap-3 rounded-xl border p-3 ${isDarkMode ? "border-[#45453B] bg-[#2A2A26]" : "border-slate-200 bg-white"}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone === "sky" ? "bg-sky-50 text-sky-700" : tone === "indigo" ? "bg-indigo-50 text-indigo-700" : tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-lg font-bold leading-none ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>{value}</p>
                          <p className={`mt-1 truncate text-[10px] font-medium ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToSection("storage")}
                    className={`mt-3 w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isDarkMode
                        ? "border-[#45453B] bg-[#2A2A26] hover:border-sky-500/50"
                        : "border-sky-200/80 bg-gradient-to-r from-sky-50/70 via-white to-indigo-50/60 hover:border-sky-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`flex items-center gap-1.5 text-xs font-extrabold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
                        <Database size={14} className="text-sky-600" />
                        User Storage System
                      </span>
                      <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-extrabold text-sky-700 dark:text-sky-300">
                        {formatStorageBytes(vaultMetrics.usedStorageBytes)} Used of {formatStorageGB(vaultMetrics.totalCapacityBytes)} Min Storage
                      </span>
                    </div>
                    <div className={`h-2 w-full overflow-hidden rounded-full border ${isDarkMode ? "border-[#383832] bg-[#1C1C19]" : "border-slate-200 bg-slate-100"}`}>
                      <div
                        style={{
                          width: `${
                            vaultMetrics.usedStorageBytes > 0
                              ? Math.min(100, Math.max(2, vaultMetrics.usagePercentage))
                              : 0
                          }%`,
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 transition-all duration-500"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-[#A1A194]">
                      <span>{formatStorageBytes(vaultMetrics.usedStorageBytes)} Used ({vaultMetrics.usagePercentage}%) • {formatStorageGB(vaultMetrics.availableStorageBytes)} Free Space ({vaultMetrics.totalItems} Records)</span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">Check Storage in Settings →</span>
                    </div>
                  </button>
                </section>
              </motion.div>

              <section className="mx-auto w-full max-w-6xl px-4 pb-2">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>Quick Academic Tools</h3>
                    <p className={`mt-1 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Choose a tool to continue your study session.</p>
                  </div>
                  <button type="button" onClick={() => navigateToSection("tools")} className="shrink-0 text-xs font-semibold text-violet-700 transition-colors hover:text-violet-900 dark:text-violet-300">
                    View all tools <ArrowRight size={13} className="ml-1 inline" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { title: "Same-to-Same Handwriting (1:1)", description: "Convert exact uploaded document into realistic student handwriting pages (Not notes)", icon: FileText, color: "from-blue-600 via-indigo-600 to-violet-600", action: () => convertDocumentSameToSameHandwriting() },
                    { title: "Chapter Summary Notes", description: "Multi-chapter AI study summaries and insights", icon: BookOpen, color: "from-amber-500 to-orange-600", action: generateNotes },
                    { title: "Question Bank", description: "MCQs, 5-mark short + diagrams, and long answers", icon: FileQuestion, color: "from-violet-600 to-purple-600", action: generateQuestionBank },
                    { title: "PPT Builder", description: "Professional slide decks and diagrams", icon: Presentation, color: "from-pink-600 to-fuchsia-600", action: generatePPT },
                    { title: "Lesson Planner", description: "Digital curriculum & study roadmap", icon: Calendar, color: "from-orange-500 to-amber-500", action: () => { if (!fileData) { setError("Please upload an e-book or document first to plan lessons."); return; } setShowLessonPlanGuidanceModal(true); } },
                    { title: "Flashcards", description: "Interactive solid pastel cards for active recall", icon: BookOpen, color: "from-emerald-600 to-teal-500", action: generateFlashcards },
                  ].map(({ title, description, icon: Icon, color, action }) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => runQuickTool(action)}
                      className={`group flex min-h-28 items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isDarkMode ? "border-[#383832] bg-gradient-to-br from-[#22221F] to-[#282824] hover:border-slate-600" : "border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 hover:border-sky-200"}`}
                    >
                      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md`}>
                        <Icon size={23} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>{title}</span>
                        <span className={`mt-1 block text-xs leading-relaxed ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>{description}</span>
                      </span>
                      <ArrowRight size={18} className={`shrink-0 transition-transform group-hover:translate-x-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                    </button>
                  ))}
                </div>
              </section>

            </div>)}



          {slides.length > 0 && (
            <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/85 shadow-[0_16px_48px_rgba(37,99,235,0.10)] backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-rose-600 to-pink-600"></div>
              <div className="border-b border-[#E0E0D5] p-5 md:p-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200">
                      {slides.length} Slides • Easy-to-Learn Deck
                    </span>
                    {selectedPPTTopic && (
                      <span className="text-[11px] font-semibold text-slate-500 truncate max-w-xs">
                        Topic: {selectedPPTTopic}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#3A3A2F]">
                    {selectedPPTTopic ? `Topic Presentation: ${selectedPPTTopic}` : "Study Presentation"}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={pptTheme}
                    onChange={(e) => setPptTheme(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs"
                  >
                    <option value="academic">Academic Theme</option>
                    <option value="professional">Professional Theme</option>
                    <option value="minimalist">Minimalist Theme</option>
                    <option value="pastel">Soft Pastel</option>
                  </select>
                  <button
                    onClick={openPPTTopicStudio}
                    className="flex items-center gap-1.5 border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="Change topic or configure presentation parameters"
                  >
                    <Sparkles size={14} className="text-pink-600" /> Change Topic / New Deck
                  </button>
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-pink-500/20 cursor-pointer"
                  >
                    <Presentation size={15} /> Preview Slides
                  </button>
                  <button 
                    onClick={downloadPPT}
                    className="flex items-center gap-1.5 bg-[#5A5A40] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer"
                  >
                    <Download size={15} /> Download PPTX
                  </button>
                  <button 
                    onClick={() => {
                      setSlides([]);
                      setResultType("");
                    }} 
                    className="text-[#8A8A7A] hover:bg-[#F5F5F0] p-2 rounded-xl transition-colors"
                    title="Close Presentation"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-pink-50/70 via-rose-50/50 to-pink-50/70 border border-pink-100 text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Presentation size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-900">
                        Educational Presentation grounded in {file ? file.name : 'uploaded document'}
                      </p>
                      <p className="text-[11px] text-pink-700/80">
                        Targeted topic: <span className="font-semibold text-pink-950">{selectedPPTTopic || 'Document Core Concepts'}</span>. Formatted with key takeaways and simple analogies for high-speed retention.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={openPPTTopicStudio}
                    className="text-xs font-bold text-pink-700 hover:text-pink-900 underline underline-offset-2 shrink-0 cursor-pointer"
                  >
                    Select a different topic →
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slides.map((slide, idx) => (
                    <div key={idx} className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Slide {idx + 1} • {slide.tag || slide.slideType || "Concept"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 mb-2.5 leading-snug">{slide.title}</h4>
                        
                        {slide.keyTakeaway && (
                          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 px-3 flex items-start gap-2 shadow-2xs">
                            <Lightbulb size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-950 leading-tight">
                              <strong className="text-[10px] uppercase tracking-wider text-amber-700 block">Key Takeaway:</strong>
                              {slide.keyTakeaway}
                            </p>
                          </div>
                        )}

                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {slide.bullets?.map((b, bIdx) => {
                            const boldMatch = b.match(/^\s*\*\*(.*?)\*\*\s*[:\-]?\s*(.*)/);
                            return (
                              <li key={bIdx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-pink-500 font-bold shrink-0">•</span>
                                {boldMatch ? (
                                  <span>
                                    <strong className="text-slate-900 font-semibold">{boldMatch[1]}</strong>: {boldMatch[2]}
                                  </span>
                                ) : (
                                  <span>{b.replace(/\*\*/g, '')}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {slide.example && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-sky-900">
                          <Sparkles size={13} className="text-sky-600 shrink-0 mt-0.5" />
                          <span><strong className="text-sky-800">Analogy:</strong> {slide.example}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {resultText && (
            <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/85 shadow-[0_16px_48px_rgba(37,99,235,0.10)] backdrop-blur-xl">
              <div className="absolute top-0 left-0 z-10 w-full h-1.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600"></div>
              <div className="relative z-10 border-b border-[#E0E0D5] p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-serif text-2xl text-[#3A3A2F]">
                    {resultType === "verbatim-handwriting"
                      ? activeMultiFunctionTitle || "Same-to-Same Handwritten Document (Exact 1:1 Copy)"
                      : resultType === "lesson-plan"
                      ? "Study Lesson Planner"
                      : resultType === "question-bank"
                      ? questionBankType === "short"
                        ? "5-Mark Short Questions (2 A4 Pages + Diagrams)"
                        : "Study Question Bank"
                      : resultType === "assessment"
                      ? "Assessment Paper"
                      : resultType === "executive-summary" ||
                        resultType === "formula-sheet" ||
                        resultType === "glossary" ||
                        resultType === "viva-qa" ||
                        resultType === "mindmap-atlas" ||
                        resultType === "cheat-sheet"
                      ? activeMultiFunctionTitle || "Scanned Document AI Function"
                      : selectedUnit !== "all" || selectedChapter !== "all"
                      ? `${selectedUnit !== "all" ? selectedUnit : ""} ${selectedChapter !== "all" ? "• " + selectedChapter : ""} - Handwriting Notes`
                      : "Handwriting Notes (Chapter & Unit Wise)"}
                  </h3>
                  {resultType === "verbatim-handwriting" && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {isVerbatimTableMode
                          ? "📊 Handwritten Table Form (1:1)"
                          : "✍️ Exact 1:1 Uploaded Document (Not Notes)"}
                      </span>
                      {fileData && (
                        <button
                          type="button"
                          onClick={() =>
                            void convertDocumentSameToSameHandwriting(
                              undefined,
                              undefined,
                              undefined,
                              undefined,
                              !isVerbatimTableMode
                            )
                          }
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isVerbatimTableMode ? "✍️ Switch to 1:1 Text Form" : "📊 Switch to Table Form"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowTableUploadModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 transition-colors cursor-pointer"
                      >
                        <Upload size={11} />
                        <span>Upload / Edit Table</span>
                      </button>
                    </div>
                  )}
                  {resultType === "lesson-plan" ? (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Digital Text & Roadmap
                    </span>
                  ) : pagesToRender.length > 0 ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                      {pagesToRender.length} {pagesToRender.length === 1 ? 'Page' : 'Pages'}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {resultType === "lesson-plan" ? (
                    <button
                      type="button"
                      onClick={() => setShowLessonPlanGuidanceModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Settings2 size={13} />
                      <span>Adjust Plan Guidance</span>
                    </button>
                  ) : (
                    <>
                      {pagesToRender.length > 1 && (
                        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => scrollToSummaryPage(currentPageIndex - 1)}
                            disabled={currentPageIndex === 0}
                            aria-label="Previous page"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="min-w-[76px] text-center text-xs font-semibold text-slate-700" aria-live="polite">
                            Page {currentPageIndex + 1} of {pagesToRender.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => scrollToSummaryPage(currentPageIndex + 1)}
                            disabled={currentPageIndex >= pagesToRender.length - 1}
                            aria-label="Next page"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}

                      {pagesToRender.length > 1 && (
                        <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm text-xs font-medium text-slate-600">
                          <button
                            type="button"
                            onClick={() => setSummaryViewMode("continuous")}
                            className={`px-3 py-1.5 rounded-full transition-all ${summaryViewMode === "continuous" ? "bg-[#5A5A40] text-white shadow-xs font-semibold" : "hover:text-slate-900"}`}
                            title="View all pages one by one following each other"
                          >
                            Continuous (All)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSummaryViewMode("single")}
                            className={`px-3 py-1.5 rounded-full transition-all ${summaryViewMode === "single" ? "bg-[#5A5A40] text-white shadow-xs font-semibold" : "hover:text-slate-900"}`}
                            title="View one page at a time"
                          >
                            Single Page
                          </button>
                        </div>
                      )}

                      <select
                        value={pageStyle ?? "ruled"}
                        onChange={(e) => setPageStyle(e.target.value)}
                        className="border border-[#5A5A40] text-[#5A5A40] bg-transparent hover:bg-[#FAF9F6] py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-widest outline-none cursor-pointer transition-colors"
                      >
                        <option value="plain">Plain Page</option>
                        <option value="ruled">Ruled Page</option>
                        <option value="box">Box Page</option>
                      </select>
                      <select
                        value={penColor ?? "blue"}
                        onChange={(e) => setPenColor(e.target.value)}
                        className="border border-[#5A5A40] text-[#5A5A40] bg-transparent hover:bg-[#FAF9F6] py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-widest outline-none cursor-pointer transition-colors"
                      >
                        <option value="black">Black Pen</option>
                        <option value="blue">Blue Pen</option>
                      </select>
                      <select
                        value={handwritingFont ?? "font-handwriting"}
                        onChange={(e) => setHandwritingFont(e.target.value)}
                        className="border border-[#5A5A40] text-[#5A5A40] bg-transparent hover:bg-[#FAF9F6] py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-widest outline-none cursor-pointer transition-colors"
                      >
                        <option value="font-handwriting">Caveat</option>
                        <option value="font-handwriting-indie">Indie Flower</option>
                        <option value="font-handwriting-kalam">Kalam</option>
                        <option value="font-handwriting-shadows">Shadows</option>
                        <option value="font-handwriting-patrick">Patrick</option>
                      </select>
                    </>
                  )}

                  {resultText && (
                    <div className="flex items-center gap-1 bg-white/50 border border-[#D1D1C4] rounded-full p-1 shadow-sm mr-1">
                      <button
                        onClick={handlePlayPauseSpeech}
                        className={`p-1.5 rounded-full transition-colors ${isSpeaking && !isSpeechPaused ? 'bg-[#5A5A40] text-white' : 'text-[#5A5A40] hover:bg-[#F0F0E8]'}`}
                        title={isSpeaking && !isSpeechPaused ? "Pause Audio" : "Play Audio"}
                      >
                        {isSpeaking && !isSpeechPaused ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill={isSpeaking && isSpeechPaused ? "currentColor" : "none"} />}
                      </button>
                      {(isSpeaking || isSpeechPaused) && (
                        <button
                          onClick={handleStopSpeech}
                          className="p-1.5 rounded-full transition-colors text-red-500 hover:bg-red-50"
                          title="Stop Audio"
                        >
                          <Square size={14} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* DIRECT FAST 1:1 SAME-PAGE PDF DOWNLOAD BUTTONS UP IN TOOLBAR */}
                  <button
                    type="button"
                    onClick={() => void downloadHandwrittenPDF(true)}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs py-2 px-4 rounded-full shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                    title="Fast Download the exact same pages shown in the interface as PDF"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <FileDown size={14} className="text-white" />
                        <span>
                          ⚡ Fast Download Same Pages ({pagesToRender.length} {pagesToRender.length === 1 ? "Page" : "Pages"})
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void downloadHandwrittenPDF(false)}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs py-2 px-3.5 rounded-full shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                    title="Download high-definition 1:1 Same-to-Same PDF of these exact pages"
                  >
                    <Download size={13} className="text-white" />
                    <span>Same-to-Same HD PDF</span>
                  </button>
                </div>
              </div>
              
              <div
                ref={notesViewerRef}
                role="region"
                aria-label="Summary page viewer"
                tabIndex={0}
                onScroll={handleNotesViewerScroll}
                className="relative z-10 max-h-[82vh] overflow-auto p-4 sm:p-8 bg-slate-100/60"
              >
                {/* 
                  Applying a handwriting font class when in student mode.
                */}
                {resultType === "exam-paper" && examPaperType === "paper-university" && (
                  (() => {
                    try {
                      let cleanedText = displayedResultText.trim();
                      if (cleanedText.startsWith("```json")) {
                        cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
                      }
                      const parsedData = JSON.parse(cleanedText);
                      return <UniversityPaperEditor initialData={parsedData} />;
                    } catch (e) {
                      console.error("Failed to parse paper-university JSON:", e);
                      return <div className="p-10 text-red-500 overflow-auto max-h-[80vh]">Error parsing generated paper format. Raw output: <pre className="mt-2 text-xs">{displayedResultText}</pre></div>;
                    }
                  })()
                )}

                {resultType === "lesson-plan" && (
                  <DigitalLessonPlanViewer
                    plan={lessonPlan || {
                      title: file ? file.name.replace(/\.[^/.]+$/, "") + " Study Plan" : "Curriculum Lesson Plan",
                      duration: "4 Weeks",
                      totalUnits: "4 Comprehensive Units",
                      recommendedDailyHours: "2 Hours / Day",
                      targetPace: "Standard Academic Pace",
                      studyGoal: "Mastery of Key Topics & Exam Readiness",
                      studyGuidance: {
                        weeklySchedule: [
                          "Week 1: Core Definitions, Foundational Principles & Architecture",
                          "Week 2: Deep Dive into Workflows, Algorithms & Key Processes",
                          "Week 3: Comparative Analysis, Critical Derivations & Edge Cases",
                          "Week 4: Comprehensive Review, Mock Testing & Exam Preparation"
                        ],
                        studyStrategies: [
                          "Employ active recall after reading each section before looking back at notes.",
                          "Use spaced repetition to review flashcards on days 1, 3, and 7.",
                          "Solve end-of-unit practice questions without consulting reference materials."
                        ],
                        pomodoroProtocol: "50-minute focused study sessions with 10-minute active recall breaks",
                        activeRecallCheckpoints: [
                          "Can you explain the main theoretical model in your own words?",
                          "Can you reproduce the core diagram or formula from memory?",
                          "Can you teach this topic to a fellow student in 3 minutes?"
                        ]
                      },
                      units: [
                        {
                          unitNumber: 1,
                          name: "Comprehensive Syllabus & Study Roadmap",
                          duration: "4 Weeks",
                          description: "Structured curriculum extracted directly from your study material.",
                          difficulty: "Intermediate",
                          objectives: [
                            "Develop an in-depth understanding of the core material",
                            "Retain key concepts through structured daily milestones",
                            "Prepare effectively for examinations and assessments"
                          ],
                          activities: [
                            "Read unit concepts and write chapter summaries",
                            "Complete self-assessment checkpoints",
                            "Review key definitions using active recall"
                          ],
                          selfAssessmentQuestions: [
                            "What are the central concepts of this module?",
                            "How do the components relate to one another?",
                            "What are the key real-world applications?"
                          ]
                        }
                      ],
                      fullMarkdownPlan: displayedResultText
                    }}
                    onOpenGuidanceModal={() => setShowLessonPlanGuidanceModal(true)}
                    onPlaySpeech={handlePlayPauseSpeech}
                    isSpeaking={isSpeaking}
                    isDarkMode={isDarkMode}
                  />
                )}

                <div 
                  ref={notesRef}
                  className={`w-full flex flex-col items-center gap-8 ${(resultType === 'exam-paper' && examPaperType === 'paper-university') || resultType === 'lesson-plan' ? 'hidden' : ''}`}
                >
                  {/* Realistic Student Handwritten Notebook Index Sheet (Table of Contents) - Shown for study notes, skipped for Same-to-Same Verbatim Document */}
                  {(mode === 'student' && resultType !== 'exam-paper' && resultType !== 'verbatim-handwriting' && handwrittenTocEntries.length > 0 && (summaryViewMode === 'continuous' || currentPageIndex === 0)) && (
                    <div
                      data-toc-sheet="true"
                      className={`w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between mx-auto bg-[#FCFBF7] shadow-xl rounded-sm border border-slate-300/80 relative ${handwritingFont} text-xl px-10 pt-16 pb-10 select-none not-prose`}
                      style={getPageSheetStyle()}
                    >
                      {/* Top Double Red Notebook Rule */}
                      <div className="absolute top-[54px] left-0 right-0 h-[4px] border-t-[1.5px] border-b-[1.5px] border-[#fca5a5] pointer-events-none" />
                      {/* Left Double Red Margin Rule */}
                      {pageStyle !== 'box' && (
                        <div className="absolute left-[58px] top-0 bottom-0 w-[4px] border-l-[1.5px] border-r-[1.5px] border-[#fca5a5] pointer-events-none" />
                      )}
                      {/* Left Binder Punch Holes */}
                      <div className="absolute left-5 top-40 w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shadow-inner pointer-events-none" />
                      <div className="absolute left-5 top-[550px] w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shadow-inner pointer-events-none" />
                      <div className="absolute left-5 bottom-40 w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shadow-inner pointer-events-none" />

                      {/* Handwritten Top-Right Notebook Corner Box */}
                      <div className={`absolute top-2 right-7 border border-[#fca5a5] rounded px-3.5 py-1 bg-[#FCFBF7] text-sm leading-tight shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]'}`}>
                        <div><strong>Index Sheet:</strong> I</div>
                        <div><strong>Date:</strong> {todayDateFormatted}</div>
                      </div>
                      <div className="absolute top-[28px] left-[78px] text-[12px] font-bold text-rose-400 select-none uppercase tracking-widest opacity-80 pointer-events-none">
                        STUDENT NOTEBOOK • TOPIC INDEX
                      </div>

                      <div className="pl-10 flex-1 flex flex-col">
                        <div className={`flex items-end justify-between border-b-2 pb-2 mb-3 ${penColor === 'blue' ? 'border-[#0f172a] text-[#0f172a]' : 'border-[#1d4ed8] text-[#1d4ed8]'}`}>
                          <div>
                            <h2 className="text-3xl font-bold tracking-wide leading-none">
                              INDEX / TABLE OF CONTENTS
                            </h2>
                            <p className={`text-base opacity-90 mt-1 ${penColor === 'blue' ? 'text-[#1d4ed8]' : 'text-[#1e293b]'}`}>
                              Handwritten Topic & Chapter Index (Click any topic row to jump to that A4 sheet)
                            </p>
                          </div>
                          <span className="text-base font-bold">
                            Sheets 1 – {pagesToRender.length}
                          </span>
                        </div>

                        <div className={`w-full border rounded overflow-hidden bg-white/40 ${penColor === 'blue' ? 'border-slate-700/40' : 'border-[#1d4ed8]/40'}`}>
                          <div className={`grid grid-cols-[58px_1fr_92px] border-b font-bold text-lg bg-rose-100/35 ${penColor === 'blue' ? 'border-slate-700/40 text-[#0f172a]' : 'border-[#1d4ed8]/40 text-[#1d4ed8]'}`}>
                            <div className="py-1 px-2 text-center border-r border-slate-300/60">Sr. No.</div>
                            <div className="py-1 px-3 border-r border-slate-300/60">Chapter / Topic & Handwritten Study Concept</div>
                            <div className="py-1 px-2 text-center">Page No.</div>
                          </div>
                          {handwrittenTocEntries.slice(0, 24).map((entry) => (
                            <button
                              key={`handwritten-toc-row-${entry.srNo}`}
                              type="button"
                              onClick={() => scrollToSummaryPage(entry.pageNumber - 1)}
                              className={`w-full text-left grid grid-cols-[58px_1fr_92px] border-b border-dashed border-slate-300/60 hover:bg-amber-50/70 transition-colors cursor-pointer text-[19px] leading-[33px] ${
                                penColor === 'blue' ? 'text-[#1d4ed8]' : 'text-[#1e293b]'
                              }`}
                            >
                              <div className={`px-2 text-center font-bold border-r border-slate-300/50 ${penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]'}`}>
                                {entry.srNo}.
                              </div>
                              <div className="px-3 truncate font-semibold border-r border-slate-300/50">
                                {entry.title}
                              </div>
                              <div className={`px-2 text-center font-bold ${penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]'}`}>
                                P. {entry.pageNumber}
                              </div>
                            </button>
                          ))}
                        </div>

                        {handwrittenTocEntries.length > 24 && (
                          <div className={`mt-2 text-right text-base font-bold ${penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]'}`}>
                            + Continues through Page {pagesToRender.length} (Use page selector or scroll to view all {pagesToRender.length} full-A4 sheets)
                          </div>
                        )}
                      </div>

                      <div className={`mt-auto pt-2 pl-10 flex items-center justify-end text-base font-bold opacity-80 ${penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]'}`}>
                        <span>— Index Page —</span>
                      </div>
                    </div>
                  )}

                  {pagesToRender.map((pageMarkdown, pageIdx) => {
                    const isPageActive = pageIdx === currentPageIndex;
                    const isSingleHidden = summaryViewMode === "single" && !isPageActive;
                    const isStudentSheet = mode === 'student' && resultType !== 'exam-paper';
                    return (
                      <div
                        key={`summary-page-sheet-${pageIdx}`}
                        id={`summary-page-${pageIdx}`}
                        className={`w-full max-w-[210mm] h-auto flex flex-col justify-start prose max-w-none page-break-before ${
                          resultType === 'exam-paper' ? 'exam-paper-table' : 'student-handwriting-table'
                        } mx-auto shadow-xl rounded-sm transition-all border border-slate-300/80 relative ${
                          isStudentSheet
                            ? `${handwritingFont} text-lg sm:text-xl px-4 sm:px-10 pt-14 pb-5 bg-[#FCFBF7]` 
                            : 'font-sans text-[#4A4A3F] p-4 sm:p-10 rounded-lg bg-white'
                        } ${isSingleHidden ? 'hidden' : ''}`}
                        style={getPageSheetStyle()}
                      >
                        {isStudentSheet ? (
                          <>
                            {/* Top Double Red Notebook Rule */}
                            <div className="absolute top-[54px] left-0 right-0 h-[4px] border-t-[1.5px] border-b-[1.5px] border-[#fca5a5] pointer-events-none" />
                            {/* Left Double Red Margin Rule */}
                            {pageStyle !== 'box' && (
                              <div className="hidden sm:block absolute left-[58px] top-0 bottom-0 w-[4px] border-l-[1.5px] border-r-[1.5px] border-[#fca5a5] pointer-events-none" />
                            )}
                            {/* Left Binder Punch Holes */}
                            <div className="hidden sm:block absolute left-5 top-[18%] w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shadow-inner pointer-events-none" />
                            <div className="hidden sm:block absolute left-5 top-[50%] w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shadow-inner pointer-events-none" />
                            <div className="hidden sm:block absolute left-5 top-[82%] w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shadow-inner pointer-events-none" />

                            {/* Handwritten Page/Date Corner Box */}
                            <div className={`absolute top-2 right-3 sm:right-7 border border-[#fca5a5] rounded px-2.5 sm:px-3 py-0.5 bg-[#FCFBF7] text-xs sm:text-sm leading-tight select-none not-prose shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${penColor === 'blue' ? 'text-[#0f172a]' : 'text-[#1d4ed8]'}`}>
                              <div><strong>Page No:</strong> {pageIdx + 1} / {pagesToRender.length}</div>
                              <div><strong>Date:</strong> {todayDateFormatted}</div>
                            </div>
                            <div className="absolute top-[28px] left-4 sm:left-[78px] text-[10px] sm:text-[12px] font-bold text-rose-400 select-none uppercase tracking-widest opacity-80 pointer-events-none truncate max-w-[52vw] sm:max-w-none">
                              {resultType === "verbatim-handwriting"
                                ? "EXACT UPLOADED DOCUMENT • STUDENT HANDWRITING PAGE"
                                : "STUDENT NOTEBOOK • A4 REVISION"}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-4 select-none not-prose text-xs text-slate-400 font-mono">
                            <span className="font-semibold text-slate-700 tracking-wide">
                              Page {pageIdx + 1} of {pagesToRender.length}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">Academic Study Notes</span>
                          </div>
                        )}

                        <div className={`${isStudentSheet ? "pl-1 sm:pl-10" : ""}`}>
                          <div className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              components={markdownComponents}
                            >
                              {pageMarkdown}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Page Bottom Footer right below content without empty gap */}
                        <div className={`mt-2 pt-1.5 flex items-center select-none not-prose ${
                          isStudentSheet
                            ? `pl-10 justify-end text-base font-bold opacity-80 ${penColor === 'blue' ? 'text-[#1d4ed8]' : 'text-[#1e293b]'}`
                            : 'border-t border-dashed border-slate-200/60 text-xs text-slate-400 font-mono justify-center'
                        }`}>
                          <span>— Page {pageIdx + 1} of {pagesToRender.length} —</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Quick Same-Page Fast Download Bar */}
                {pagesToRender.length > 0 && resultType !== "lesson-plan" && (
                  <div className="mt-6 mx-auto max-w-[210mm] rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FileDown size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Ready for Same-to-Same PDF Download ({pagesToRender.length} {pagesToRender.length === 1 ? "Page" : "Pages"} Exact Match)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Downloads the exact same pages, layout, and table columns shown above in the interface.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void downloadHandwrittenPDF(true)}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs py-2.5 px-5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                        <span>⚡ Fast Download Same Pages ({pagesToRender.length} {pagesToRender.length === 1 ? "Page" : "Pages"})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void downloadHandwrittenPDF(false)}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 px-4 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Download size={14} />
                        <span>Same-to-Same HD PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>)}
          {flashcards.length > 0 && (
            <FlashcardStudio
              flashcards={flashcards}
              onUpdateFlashcards={setFlashcards}
              isDarkMode={isDarkMode}
              onDownloadCSV={downloadCSV}
            />
          )}
          {resultType === "video" && videoData && (
            <VideoExplainer 
              videoData={videoData}
              onRegenerateTopic={(customTopic) => void generateVideoExplanation(customTopic)}
              isRegenerating={loading && generatingType === "video"}
              onClose={() => {
                setVideoData(null);
                setResultType("");
              }}
            />
          )}
      {/* Live Page Scanner Modal Overlay */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-[#3A3A2F]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[28px] shadow-2xl border border-[#E0E0D5] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E0E0D5] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#3A3A2F]">Live Book & Document Scanner</h3>
                <p className="text-xs text-[#8A8A7A]">Align your textbook page or handwritten notes to capture a clear summary</p>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsScannerOpen(false);
                }
}
                className="p-2 hover:bg-[#E8E8E0] text-[#8A8A7A] hover:text-[#5A5A40] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 bg-[#FAF9F6] flex flex-col items-center justify-center min-h-[300px] relative">
              {cameraError && (
                <div className="text-center p-6 bg-red-50 border border-red-200 rounded-2xl max-w-md">
                  <p className="text-sm font-bold text-red-800">Camera Error</p>
                  <p className="text-xs text-red-600 mt-2">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-full transition-colors"
                  >
                    Try Again
                  </button>
                </div>)}

              {isCameraLoading && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="animate-spin text-[#5A5A40]" size={32} />
                  <p className="text-xs text-[#8A8A7A]">Starting camera feed...</p>
                </div>)}

              {/* Live Feed Container */}
              {!cameraError && !capturedPhoto && !isCameraLoading && (
                <div className="relative w-full aspect-video max-w-lg bg-black rounded-2xl overflow-hidden shadow-inner border border-[#E0E0D5]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay Guides */}
                  <div className="absolute inset-4 border border-dashed border-white/60 pointer-events-none rounded-xl flex items-center justify-center">
                    <div className="text-[10px] bg-black/40 text-white/90 px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                      Align Textbook Page Here
                    </div>
                  </div>
                </div>)}

              {/* Captured Photo Review */}
              {capturedPhoto && (
                <div className="relative w-full aspect-video max-w-lg bg-black rounded-2xl overflow-hidden shadow-md border border-[#E0E0D5]">
                  <img
                    src={capturedPhoto}
                    alt="Captured textbook page"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#5A5A40]/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Snapshot Review
                  </div>
                </div>)}
            </div>

            {/* Footer Controls */}
            <div className="p-6 border-t border-[#E0E0D5] flex justify-between items-center bg-white">
              {!capturedPhoto ? (
                <>
                  <button
                    onClick={() => {
                      stopCamera();
                      setIsScannerOpen(false);
                    }
}
                    className="px-5 py-2.5 rounded-full border border-[#D1D1C4] text-[#8A8A7A] hover:text-[#5A5A40] text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={isCameraLoading || !cameraStream}
                    className="px-6 py-2.5 rounded-full bg-[#5A5A40] text-white hover:bg-opacity-90 disabled:opacity-50 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Camera size={14} /> Capture Page
                  </button>
                </>) : (
                <>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-full border border-[#D1D1C4] text-[#8A8A7A] hover:text-[#5A5A40] text-xs font-bold transition-colors"
                  >
                    Retake Photo
                  </button>
                  <button
                    onClick={() => {
                      const photoData = capturedPhoto;
                      stopCamera();
                      setIsScannerOpen(false);
                      runEasyOCR(undefined, photoData);
                    }}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <ScanText size={14} /> Run EasyOCR Extractor
                  </button>
                  <button
                    onClick={confirmScan}
                    className="px-6 py-2.5 rounded-full bg-[#5A5A40] text-white hover:bg-opacity-90 text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    Confirm & Process Scan
                  </button>
                </>)}
            </div>
          </motion.div>
        </div>)}

      {/* PDF Export Progress Overlay Modal */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-[#3A3A2F]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-[#E0E0D5] p-8 max-w-sm w-full text-center space-y-4"
          >
            <div className="flex justify-center">
              <div className="relative w-16 h-16 flex items-center justify-center bg-[#F5F5F0] rounded-full">
                <Loader2 className="animate-spin text-[#5A5A40]" size={32} />
                <FileText className="text-[#8A8A7A] absolute" size={16} />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#3A3A2F]">Generating Your PDF</h3>
              <p className="text-xs text-[#8A8A7A]">Please wait while we compile and style your handwritten study notes.</p>
            </div>

            {/* Custom styled progress bar */}
            <div className="w-full bg-[#F5F5F0] h-2.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-[#5A5A40] h-full rounded-full"
                animate={{ width: `${exportProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-mono text-[#8A8A7A] px-1">
              <span className="uppercase tracking-wider">Status</span>
              <span>{exportProgress}%</span>
            </div>
            
            <p className="text-[10px] font-medium text-[#6A6A5A] italic bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E0E0D5]/60 min-h-[44px] flex items-center justify-center">
              {exportStatus}
            </p>
          </motion.div>
        </div>
      )}
          </>
          )}
      </div>
      </div>
    
      {showPreviewModal && (
        <SlidePreviewModal 
          slides={slides} 
          topic={selectedPPTTopic}
          theme={pptTheme}
          onClose={() => setShowPreviewModal(false)} 
        />
      )}
      <PPTTopicStudioModal
        isOpen={showPPTStudioModal}
        onClose={() => setShowPPTStudioModal(false)}
        fileName={file ? file.name : "Study Material"}
        fileUri={fileData?.fileUri || ""}
        mimeType={fileData?.mimeType || "application/pdf"}
        onGenerate={handleGenerateFromStudio}
        isGenerating={loading && generatingType === "ppt"}
        isDarkMode={isDarkMode}
      />
      {showSettings && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && setShowSettings(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className={`w-full ${
              settingsTab === "storage" ? "max-w-5xl" : "max-w-xl"
            } max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all ${
              isDarkMode ? "border-[#383832] bg-[#22221F] text-[#E0E0D5]" : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            {/* Settings Header & Tab Switcher */}
            <div className={`flex flex-col gap-3 border-b px-5 py-4 ${isDarkMode ? "border-[#383832] bg-[#1C1C19]" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h2 id="settings-title" className="text-base sm:text-lg font-bold leading-tight">
                      Settings
                    </h2>
                    <p className={`text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                      Manage your workspace preferences, security, and My Storage (3 GB minimum capacity).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  aria-label="Close settings"
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer ${
                    isDarkMode ? "hover:bg-[#383832]" : "hover:bg-slate-200/70"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Settings Navigation Tabs: General vs My Storage */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSettingsTab("general")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === "general"
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm"
                      : isDarkMode
                        ? "bg-[#2A2A26] text-[#C2C2B0] hover:bg-[#383832]"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Settings size={14} />
                  General Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("storage")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === "storage"
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm"
                      : isDarkMode
                        ? "bg-[#2A2A26] text-[#C2C2B0] hover:bg-[#383832]"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Database size={14} />
                  <span>My Storage</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      settingsTab === "storage"
                        ? "bg-white/20 text-white"
                        : isDarkMode
                          ? "bg-sky-500/20 text-sky-300"
                          : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {formatStorageBytes(vaultMetrics.usedStorageBytes)} / {formatStorageGB(vaultMetrics.totalCapacityBytes)}
                  </span>
                </button>
              </div>
            </div>

            {/* Settings Body */}
            <div className="overflow-y-auto p-5 space-y-5">
              {settingsTab === "general" ? (
                <>
                  {/* My Storage Option inside Settings */}
                  <div
                    className={`rounded-2xl border p-4 transition-all ${
                      isDarkMode
                        ? "border-sky-500/30 bg-gradient-to-br from-[#2A2A26] to-[#1E232A]"
                        : "border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            isDarkMode
                              ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                              : "border-sky-200 bg-sky-100/80 text-sky-600"
                          }`}
                        >
                          <HardDrive size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold">My Storage</h3>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                isDarkMode
                                  ? "border-indigo-400/30 bg-indigo-500/20 text-indigo-300"
                                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              {vaultMetrics.usagePercentage}% Used
                            </span>
                          </div>
                          <p className={`mt-0.5 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
                            {formatStorageBytes(vaultMetrics.usedStorageBytes)} actually used from{" "}
                            {formatStorageGB(vaultMetrics.totalCapacityBytes)} minimum storage ({vaultMetrics.totalItems} saved items)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSettingsTab("storage")}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer"
                      >
                        <Database size={14} />
                        Check My Storage
                      </button>
                    </div>

                    {/* Storage Breakdown Mini Cards */}
                    <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                      <div
                        className={`rounded-xl border px-3 py-2 ${
                          isDarkMode ? "border-sky-500/30 bg-sky-500/10" : "border-sky-200 bg-white"
                        }`}
                      >
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          Used Data
                        </span>
                        <span className="mt-0.5 block text-sm font-black">
                          {formatStorageBytes(vaultMetrics.usedStorageBytes)}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl border px-3 py-2 ${
                          isDarkMode ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-white"
                        }`}
                      >
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Free Space
                        </span>
                        <span className="mt-0.5 block text-sm font-black">
                          {formatStorageGB(vaultMetrics.availableStorageBytes)}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl border px-3 py-2 ${
                          isDarkMode ? "border-indigo-500/30 bg-indigo-500/10" : "border-indigo-200 bg-white"
                        }`}
                      >
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Total Storage
                        </span>
                        <span className="mt-0.5 block text-sm font-black">
                          {formatStorageGB(vaultMetrics.totalCapacityBytes)}
                        </span>
                      </div>
                    </div>

                    {/* Storage Progress Bar */}
                    <div className="mt-3">
                      <div
                        className={`h-2.5 w-full overflow-hidden rounded-full border ${
                          isDarkMode ? "border-[#383832] bg-[#161614]" : "border-slate-200 bg-slate-100"
                        }`}
                      >
                        <div
                          style={{
                            width: `${
                              vaultMetrics.usedStorageBytes > 0
                                ? Math.min(100, Math.max(2, vaultMetrics.usagePercentage))
                                : 0
                            }%`,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 transition-all duration-500"
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-[#A1A194]">
                        <span>0 GB</span>
                        <span className="text-sky-600 dark:text-sky-400">
                          • {formatStorageBytes(vaultMetrics.usedStorageBytes)} Used ({vaultMetrics.usagePercentage}%)
                        </span>
                        <span>{formatStorageGB(vaultMetrics.totalCapacityBytes)} Min Storage</span>
                      </div>
                    </div>
                  </div>

                  {/* Reading & Notebook Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-[#A1A194]">
                      Reading & Notebook Preferences
                    </h3>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>Page style</span>
                      <select
                        value={pageStyle}
                        onChange={(event) => setPageStyle(event.target.value)}
                        className={`rounded-lg border px-3 py-2 text-xs outline-none ${
                          isDarkMode ? "border-[#4A4A3F] bg-[#2D2D2A]" : "border-slate-200 bg-white"
                        }`}
                      >
                        <option value="plain">Plain</option>
                        <option value="ruled">Ruled</option>
                        <option value="box">Grid</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>Ink color</span>
                      <select
                        value={penColor}
                        onChange={(event) => setPenColor(event.target.value)}
                        className={`rounded-lg border px-3 py-2 text-xs outline-none ${
                          isDarkMode ? "border-[#4A4A3F] bg-[#2D2D2A]" : "border-slate-200 bg-white"
                        }`}
                      >
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span>Handwriting font</span>
                      <select
                        value={handwritingFont}
                        onChange={(event) => setHandwritingFont(event.target.value)}
                        className={`max-w-44 rounded-lg border px-3 py-2 text-xs outline-none ${
                          isDarkMode ? "border-[#4A4A3F] bg-[#2D2D2A]" : "border-slate-200 bg-white"
                        }`}
                      >
                        <option value="font-handwriting">Caveat</option>
                        <option value="font-handwriting-indie">Indie Flower</option>
                        <option value="font-handwriting-kalam">Kalam</option>
                        <option value="font-handwriting-shadows">Shadows Into Light</option>
                        <option value="font-handwriting-patrick">Patrick Hand</option>
                      </select>
                    </label>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className={`pt-4 border-t ${isDarkMode ? "border-[#383832]" : "border-slate-100"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-sm font-semibold">Two-Factor Authentication</span>
                        <span className={`block text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                          SMS OTP protection for sign in
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettings(false);
                          setShowMfaModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sm transition-all cursor-pointer"
                      >
                        Configure 2FA
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSettingsTab("general")}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        isDarkMode
                          ? "border-[#45453B] bg-[#2A2A26] text-[#E0E0D5] hover:bg-[#383832]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      ← Back to General Settings
                    </button>
                    <span className={`text-xs font-medium ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                      Settings → My Storage Vault
                    </span>
                  </div>
                  <UserStorageVaultPanel
                    userKey={userStorageKey}
                    userEmail={user?.email || (isQuickGuest ? "Primary Workspace Profile" : undefined)}
                    isDarkMode={isDarkMode}
                    personalLibraryBooks={personalLibraryBooks}
                    onOpenStudyItem={(item) => {
                      setShowSettings(false);
                      handleSelectHistoryItem(item);
                    }}
                    onOpenUploadedDocument={(docMeta) => {
                      setShowSettings(false);
                      void handleOpenStoredUploadFromVault(docMeta);
                    }}
                    onOpenLibraryBook={(book) => {
                      setShowSettings(false);
                      void handleStudyLibraryBook(book);
                    }}
                    onSaveCurrentWorkspaceNow={handleSaveCurrentWorkspaceToVault}
                    onUploadFileToStorage={(uploadedFile) => handleUploadFile(uploadedFile, "User Storage Vault (3GB)")}
                    onVaultChanged={() => setStorageRefreshTick((t) => t + 1)}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {showAbout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setShowAbout(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="about-title" className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDarkMode ? "border-[#383832] bg-[#22221F] text-[#E0E0D5]" : "border-slate-200 bg-white text-slate-800"}`}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h2 id="about-title" className="text-lg font-semibold">About Notivexa AI</h2>
                  <p className={`text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Learning workspace</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAbout(false)} aria-label="Close about dialog" className={`flex h-9 w-9 items-center justify-center rounded-full ${isDarkMode ? "hover:bg-[#383832]" : "hover:bg-slate-100"}`}>
                <X size={18} />
              </button>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>
              Notivexa AI brings study materials, learning tools, and saved study activity together in one academic workspace.
            </p>
          </section>
        </div>
      )}
      {user && (
        <MfaSettingsModal
          user={user}
          isDarkMode={isDarkMode}
          isOpen={showMfaModal}
          onClose={() => setShowMfaModal(false)}
        />
      )}
      <EasyOCRModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        loading={ocrLoading}
        result={ocrResult}
        onApplyToWorkspace={handleApplyOcrToWorkspace}
        previewImageUrl={ocrPreviewImage}
        isDarkMode={isDarkMode}
      />
      <LessonPlanGuidanceModal
        isOpen={showLessonPlanGuidanceModal}
        onClose={() => setShowLessonPlanGuidanceModal(false)}
        onGenerate={generateLessonPlan}
        documentTitle={file ? file.name : "Study Material"}
        isDarkMode={isDarkMode}
        isGenerating={loading && generatingType === "lesson-plan"}
      />
      <TableUploadHandwritingModal
        isOpen={showTableUploadModal}
        onClose={() => setShowTableUploadModal(false)}
        onGenerateFromTableGrid={async (payload) => {
          await convertDocumentSameToSameHandwriting(
            undefined,
            "text/markdown",
            payload.title,
            undefined,
            true,
            payload
          );
        }}
        onUploadTableFile={async (uploadedTableFile) => {
          setShowTableUploadModal(false);
          await handleUploadFileAndConvertHandwriting(uploadedTableFile, true);
        }}
        onConvertCurrentDocToTable={
          fileData
            ? async () => {
                await convertDocumentSameToSameHandwriting(
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  true
                );
              }
            : undefined
        }
        hasActiveDocument={Boolean(fileData)}
        activeDocumentName={file?.name || digitalScanReport?.documentTitle || "Active Document"}
        isGenerating={loading && (generatingType === "handwritten-table-form" || generatingType === "verbatim-handwriting")}
        isDarkMode={isDarkMode}
      />
      {showCreateDigitalDocModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setShowCreateDigitalDocModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl transition-all ${
              isDarkMode ? "border-[#383832] bg-[#22221F] text-[#F5F5F0]" : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">
                    Create / Paste Digital Document File
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                    Paste lecture notes, syllabus units, or textbook chapters to create an active digital document file in the upload system.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDigitalDocModal(false)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDarkMode ? "hover:bg-[#383832] text-[#A1A194]" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-700"}`}>
                    Digital Document File Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Computer_Networks_Unit_1_to_4"
                    value={customDigitalDocTitle}
                    onChange={(e) => setCustomDigitalDocTitle(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                      isDarkMode
                        ? "bg-[#2A2A26] border-[#45453B] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-700"}`}>
                    File Format
                  </label>
                  <select
                    value={customDigitalDocFormat}
                    onChange={(e) => setCustomDigitalDocFormat(e.target.value as any)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDarkMode
                        ? "bg-[#2A2A26] border-[#45453B] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value=".md">Markdown (.MD)</option>
                    <option value=".txt">Plain Text (.TXT)</option>
                    <option value=".csv">Spreadsheet (.CSV)</option>
                    <option value=".json">Structured (.JSON)</option>
                  </select>
                </div>
              </div>

              {/* Quick Fill Sample Templates */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A] mr-1">
                  Quick Fill Template:
                </span>
                {SAMPLE_DIGITAL_DOCUMENTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setCustomDigitalDocTitle(sample.fileName.replace(/\.[^/.]+$/, ""));
                      setCustomDigitalDocFormat(sample.format);
                      setCustomDigitalDocContent(sample.content);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      isDarkMode
                        ? "bg-[#2A2A26] border-[#45453B] text-sky-300 hover:bg-[#383832]"
                        : "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                    }`}
                  >
                    + {sample.title}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-700"}`}>
                    Digital Document Content (Chapters, Syllabus, Notes, Formulas, or Questions)
                  </label>
                  <span className="text-[10px] text-[#8A8A7A]">
                    {customDigitalDocContent.trim() ? `${customDigitalDocContent.trim().split(/\s+/).length} words` : "0 words"}
                  </span>
                </div>
                <textarea
                  rows={10}
                  placeholder="Paste or type your digital document text, syllabus units, lecture notes, formulas, or research article here..."
                  value={customDigitalDocContent}
                  onChange={(e) => setCustomDigitalDocContent(e.target.value)}
                  className={`w-full p-3.5 rounded-2xl border text-xs font-mono leading-relaxed outline-none resize-y ${
                    isDarkMode
                      ? "bg-[#1A1A17] border-[#45453B] text-[#E0E0D5]"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDigitalDocModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    isDarkMode
                      ? "border-[#45453B] text-[#C2C2B0] hover:bg-[#383832]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || customDigitalDocContent.trim().length < 20}
                  onClick={() =>
                    void handleUploadDirectDigitalDoc(
                      customDigitalDocTitle || "Custom_Digital_Study_Document",
                      customDigitalDocContent,
                      customDigitalDocFormat
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 hover:from-sky-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ScanText size={14} />}
                  <span>Upload Digital Document File & Scan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
