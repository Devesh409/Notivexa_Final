import { Slide } from "./types";
import { SlidePreviewModal } from "./components/SlidePreviewModal";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen, GraduationCap, Upload, FileText, Presentation, FileQuestion, Download, Loader2, Shuffle, LogOut, AlertCircle, X, Camera, Clock, Trash2, RefreshCw, ExternalLink, Calendar, FileVideo, Sun, Moon, CheckCircle2, Workflow, ArrowRight, Sparkles, ChevronDown, Maximize2 } from "lucide-react";
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
import { Chatbot } from "./components/Chatbot";

type Mode = "student";


export const cleanBulletText = (text: string): string => {
  if (!text) return "";
  return text
    .trim()
    .replace(/^[\s\*\-\+•▪▫❖➔➢✔✓☑●○◘◙◦✓\-]+/g, "")
    .trim();
};

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

function splitMergedMermaidLine(line: string): string[] {
  if (!line.trim()) return [];

  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    // Handle quotes to avoid splitting inside string literals
    if ((char === '"' || char === "'") && (i === 0 || line[i - 1] !== '\\')) {
      if (inQuotes) {
        if (char === quoteChar) {
          inQuotes = false;
          quoteChar = "";
        }

      }
 else {
        inQuotes = true;
        quoteChar = char;
      }

    }


    current += char;

    if (!inQuotes) {
      const remaining = line.slice(i + 1);
      const isBoundary = char === '"' || char === "'" || char === ')' || char === ']' || char === '}';

      // Check for arrows in the middle of the line (using single space separator or no space if right after boundary)
      const arrowPattern = isBoundary 
        ? /^(\s*)([A-Za-z0-9_\-]+)\s*(->|-->|->>|-->>|=>|==>)/i
        : /^(\s+)([A-Za-z0-9_\-]+)\s*(->|-->|->>|-->>|=>|==>)/i;

      // Check for keywords in the middle of the line (using single space separator or no space if right after boundary)
      const keywordPattern = isBoundary
        ? /^(\s*)(Note|participant|rect|loop|alt|opt|end|subgraph|classDef|click|style|linkStyle)\b/i
        : /^(\s+)(Note|participant|rect|loop|alt|opt|end|subgraph|classDef|click|style|linkStyle)\b/i;

      const arrowMatch = remaining.match(arrowPattern);
      const keywordMatch = remaining.match(keywordPattern);

      if (arrowMatch) {
        parts.push(current.trim());
        current = "";
        // Advance i to skip the spaces before the matched content
        i += arrowMatch[1].length;
      }
 else if (keywordMatch) {
        parts.push(current.trim());
        // Set current to the keyword, and advance i past both the spaces and the matched keyword
        current = keywordMatch[2];
        i += keywordMatch[1].length + keywordMatch[2].length;
      }

    }

  }


  if (current.trim()) {
    parts.push(current.trim());
  }


  return parts;
}

function sanitizeNodeSegment(segment: string): string {
  let trimmed = segment.trim();
  if (!trimmed) return "";

  // Check if segment is a bracketed node declaration like A["Label"] or A[Label] or A("Label")
  const bracketMatch = trimmed.match(/^([A-Za-z0-9_\-]+)\s*(\(\[\"|\(\(\"|\[\[\"|\[\(\"|\{\{\"|\[\"|\(\"|\{\"|\>\"|\(\[|\(\(|\[\[|\[\(|\{\{|\[|\(|\{|\>)(.*?)([\"'\s]*[\)\]\}]+)$/);
  if (bracketMatch) {
    const nodeId = bracketMatch[1];
    const openBracket = bracketMatch[2];
    let content = bracketMatch[3].trim();

    // Clean inner content
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1).trim();
    }

    content = content.replace(/"/g, "'").replace(/\\/g, "").replace(/\|\|/g, " or ").replace(/\|/g, "/");

    let openChar = "[";
    let closeChar = "]";
    if (openBracket.includes('(') && openBracket.includes('[')) { openChar = "( ["; closeChar = "] )"; }
    else if (openBracket.includes('(') && openBracket.length > 1) { openChar = "( ("; closeChar = ") )"; }
    else if (openBracket.includes('[')) {
      if (openBracket.includes('(')) { openChar = "[ ("; closeChar = ") ]"; }
      else if (openBracket.length > 1) { openChar = "[ ["; closeChar = "] ]"; }
      else { openChar = "["; closeChar = "]"; }
    }
 else if (openBracket.includes('{')) {
      if (openBracket.length > 1) { openChar = "{ {"; closeChar = "} }"; }
      else { openChar = "{"; closeChar = "}"; }
    }
 else if (openBracket.includes('(')) { openChar = "("; closeChar = ")"; }
    else if (openBracket.includes('>')) { openChar = ">"; closeChar = "]"; }

    const cleanOpen = openChar.replace(/\s+/g, "");
    const cleanClose = closeChar.replace(/\s+/g, "");
    return `${nodeId}${cleanOpen}"${content}"${cleanClose}`;
  }


  // Check if segment is unbracketed Node ID + label text (e.g. "B Examination: Assessment" or "B Examination:")
  const unbracketedMatch = trimmed.match(/^([A-Za-z0-9_\-]+)\s+(.+)$/);
  if (unbracketedMatch) {
    const nodeId = unbracketedMatch[1];
    let label = unbracketedMatch[2].trim();

    // Preserve Mermaid keywords and header statements like "graph TD", "flowchart LR"
    if (/^(graph|flowchart|subgraph|style|classDef|click|linkStyle|end|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|xychart|requirement|C4|mindmap|timeline|block|packet|architecture|kanban|sankey)$/i.test(nodeId)) {
      return `${nodeId} ${label}`;
    }


    // If label is quoted, unwrap it
    if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith("'") && label.endsWith("'"))) {
      label = label.slice(1, -1).trim();
    }

    label = label.replace(/"/g, "'").replace(/\\/g, "").replace(/\|\|/g, " or ").replace(/\|/g, "/");

    if (label) {
      return `${nodeId}["${label}"]`;
    }

    return nodeId;
  }


  // Otherwise it's a bare node ID like "A" or "Node_1" or quoted `"Node_1"`
  return trimmed.replace(/["']/g, "");
}

function sanitizeFlowchartLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  if (/^(graph|flowchart|subgraph|style|classDef|click|linkStyle|end)\b/i.test(trimmed) && !/(-->|---|==>|->)/.test(trimmed)) {
    return trimmed;
  }


  // Split by arrow operators
  const arrowRegex = /(-->|---|==>|-\.-\>|->>|-->>|->)/g;
  const segments: string[] = [];
  const operators: string[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = arrowRegex.exec(trimmed)) !== null) {
    const segment = trimmed.slice(lastIndex, match.index);
    segments.push(segment);
    operators.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  segments.push(trimmed.slice(lastIndex));

  // Sanitize each node segment
  const sanitizedSegments = segments.map(s => sanitizeNodeSegment(s));

  // Rebuild the line with arrow operators
  let result = "";
  for (let i = 0; i < sanitizedSegments.length; i++) {
    result += sanitizedSegments[i];
    if (i < operators.length) {
      result += ` ${operators[i]} `;
    }

  }


  return result.trim();
}

function splitSequenceDiagramLine(line: string): string[] {
  let trimmed = line.trim();
  if (!trimmed) return [];

  const statements: { index: number; text: string }[] = [];

  const arrowRegex = /([A-Za-z0-9_\-]+)\s*(->>|-->>|->|-->|=>|==>|x->|x-->|->\+|->-|->>\+|->>-)\s*([A-Za-z0-9_\-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = arrowRegex.exec(trimmed)) !== null) {
    statements.push({ index: m.index, text: m[0] });
  }


  const kwRegex = /\b(participant|actor|box|loop|alt|opt|par|rect|critical|break|Note\s+(?:left of|right of|over)?|activate|deactivate|end|else|option|autonumber|title)\b/gi;
  while ((m = kwRegex.exec(trimmed)) !== null) {
    statements.push({ index: m.index, text: m[0] });
  }


  if (statements.length <= 1) {
    if ((trimmed.includes("->>") || trimmed.includes("-->>") || trimmed.includes("->") || trimmed.includes("-->")) && !trimmed.includes(":")) {
      trimmed = trimmed.replace(/^([A-Za-z0-9_\-]+\s*(?:->>|-->>|->|-->)\s*[A-Za-z0-9_\-]+)\s+(.+)$/, '$1: $2');
    }

    return [trimmed];
  }


  statements.sort((a, b) => a.index - b.index);

  const filtered: { index: number; text: string }[] = [];
  for (const st of statements) {
    if (filtered.length === 0 || st.index > filtered[filtered.length - 1].index) {
      filtered.push(st);
    }

  }


  const results: string[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const startPos = filtered[i].index;
    const endPos = (i + 1 < filtered.length) ? filtered[i + 1].index : trimmed.length;
    let piece = trimmed.slice(startPos, endPos).trim();
    
    if ((piece.includes("->>") || piece.includes("-->>") || piece.includes("->") || piece.includes("-->")) && !piece.includes(":")) {
      piece = piece.replace(/^([A-Za-z0-9_\-]+\s*(?:->>|-->>|->|-->)\s*[A-Za-z0-9_\-]+)\s+(.+)$/, '$1: $2');
    }


    if (piece) {
      results.push(piece);
    }

  }


  return results.length > 0 ? results : [trimmed];
}

function cleanMermaidChart(chartCode: string): string {
  if (!chartCode) return "";

  let code = chartCode.replace(/\\n/g, "\n").trim();
  code = code.replace(/^```mermaid\s*/i, "").replace(/```\s*$/, "").trim();

  // Separate header (graph TD / flowchart LR) if directly followed by nodes or arrows on the same line
  code = code.replace(/^(graph\s+[A-Za-z0-9]+|flowchart\s+[A-Za-z0-9]+)\s*(.+)$/i, (match, header, rest) => {
    const trimmedRest = rest.trim();
    if (trimmedRest) {
      return `${header}\n${trimmedRest}`;
    }

    return header;
  });

  // 1. Remove quotes placed around node IDs before brackets:
  code = code.replace(/"([A-Za-z0-9_\-]+)"\s*([\[\(\{]+)/g, '$1$2');
  code = code.replace(/'([A-Za-z0-9_\-]+)'\s*([\[\(\{]+)/g, '$1$2');

  // 2. Remove quotes wrapping an entire node expression:
  code = code.replace(/"([A-Za-z0-9_\-]+)\s*([\[\(\{]+)(.*?)([\]\)\}]+)"/g, (_, id, openB, content, closeB) => {
    let cleanContent = content.trim();
    if ((cleanContent.startsWith("'") && cleanContent.endsWith("'")) || (cleanContent.startsWith('"') && cleanContent.endsWith('"'))) {
      cleanContent = cleanContent.slice(1, -1);
    }

    cleanContent = cleanContent.replace(/"/g, "'");
    return `${id}${openB}"${cleanContent}"${closeB}`;
  });

  // 3. Fix single quotes inside node labels:
  code = code.replace(/\b([A-Za-z0-9_\-]+)\s*([\[\(\{]+)\s*'([^'\n]+)'\s*([\]\)\}]+)/g, '$1$2"$3"$4');

  // 4. Fix HTML break tags
  code = code.replace(/<br\s*\/?>/gi, " ");

  // 5. Fix quotes around arrow targets: e.g. --> "NodeID" -> --> NodeID
  code = code.replace(/(-->|---|==>|-\.-\>|->>|-->>|->)\s*"([A-Za-z0-9_\-]+)"(?!\s*[\[\(\{])/g, '$1 $2');

  return code;
}

function preprocessMermaid(chartCode: string): string {
  if (!chartCode) return "";

  let normalized = cleanMermaidChart(chartCode);

  const isSequence = /^\s*sequenceDiagram\b/i.test(normalized);
  const isFlowchart = /^\s*(flowchart|graph)\b/i.test(normalized) || !isSequence;

  const rawLines = normalized.split(/\r?\n/);
  const lines: string[] = [];

  // Pre-pass: separate header if merged with line 1 content
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^(graph\s+[A-Za-z0-9]+|flowchart\s+[A-Za-z0-9]+)\s*(.+)$/i);
    if (headerMatch) {
      lines.push(headerMatch[1].trim());
      if (headerMatch[2].trim()) {
        lines.push(headerMatch[2].trim());
      }

    }
 else {
      lines.push(trimmed);
    }

  }


  const processedLines: string[] = [];
  let lastNodeId: string | null = null;
  let insideLegend = false;

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    trimmed = trimmed.replace(/([A-Za-z0-9])'([A-Za-z0-9])/g, '$1’$2');

    if (isSequence) {
      const seqLines = splitSequenceDiagramLine(trimmed);
      for (const seqLine of seqLines) {
        if (seqLine.trim()) processedLines.push(seqLine.trim());
      }

      continue;
    }


    const splitLines = splitMergedMermaidLine(trimmed);
    for (let splitLine of splitLines) {
      let part = splitLine.trim();
      if (!part) continue;

      if (/^subgraph\s+(.*legend.*|.*key.*)/i.test(part)) {
        insideLegend = true;
        continue;
      }

      if (insideLegend && /^end/i.test(part)) {
        insideLegend = false;
        continue;
      }

      if (insideLegend) continue;
      
      // Also skip standalone nodes that are just a legend box
      if (/^(legend|key)[0-9]*\s*\[/i.test(part) || part.toLowerCase().includes('["legend"]')) {
        continue;
      }


      if (isFlowchart) {
        // Is it purely a header line like "graph TD" or "subgraph Title" or "end"?
        if (/^(graph|flowchart|subgraph|style|classDef|click|linkStyle|end)\b/i.test(part) && !/(-->|---|==>|->)/.test(part)) {
          processedLines.push(part);
          continue;
        }


        // Handle orphan leading arrows like "--> B["Label"]" or "--> B"
        const leadingArrowMatch = part.match(/^(-->|---|==>|-\.-\>|->>|-->>|->)\s*(.*)$/);
        if (leadingArrowMatch) {
          const arrowOp = leadingArrowMatch[1];
          const rest = leadingArrowMatch[2].trim();
          if (lastNodeId) {
            part = `${lastNodeId} ${arrowOp} ${rest}`;
          }
 else {
            // No previous node ID, strip the leading arrow
            part = rest;
          }

        }


        // Sanitize node labels and ensure valid syntax
        part = sanitizeFlowchartLine(part);

        // Track last node ID from this line for subsequent orphan arrows
        const allNodeIds = Array.from(part.matchAll(/\b([A-Za-z0-9_\-]+)\s*(?:[\[\(\{]|$)/g)).map(m => m[1]);
        if (allNodeIds.length > 0) {
          lastNodeId = allNodeIds[allNodeIds.length - 1];
        }

      }


      if (part.trim()) {
        processedLines.push(part.trim());
      }

    }

  }


  return processedLines.join('\n');
}

function extractNodes(chart: string): { id: string; label: string }[] {
  const extracted: { id: string; label: string }[] = [];
  const matches = Array.from(chart.matchAll(/([A-Za-z0-9_\-]+)\s*(?:[\[\(\{]+(.*?)[\]\)\}]+|(?:\s+([A-Za-z0-9_\-:\.,\s]+)))/g));
  for (const m of matches) {
    const id = m[1];
    const label = (m[2] || m[3] || id).replace(/["']/g, "").trim();
    if (label && !["graph", "flowchart", "TD", "LR", "TB", "BT", "RL"].includes(id) && !extracted.some(n => n.label === label)) {
      extracted.push({ id, label });
    }

  }

  return extracted;
}

function MermaidChart({ chart, handwritingFont, mode, penColor, isDarkMode }: { chart: string; handwritingFont?: string; mode?: string; penColor?: string; isDarkMode?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [parsedNodes, setParsedNodes] = useState<{ id: string; label: string }[]>([]);
  const preprocessedChart = preprocessMermaid(chart);

  useEffect(() => {
    setHasError(false);
    setParsedNodes(extractNodes(chart));
    
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
    const bkgColor = isDark ? '#22221f' : '#ffffff';

    mermaid.initialize({
      htmlLabels: false,
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: "base",
      themeVariables: {
        fontFamily: font,
        primaryColor: bkgColor,
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
        // Level 1: Clean labels to strictly safe characters
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
          console.warn("Level 1 fallback failed, trying level-2 rebuild...", fallbackErr);
          
          // Level 2: Rebuild simplified graph TD with plain text labels
          const rawLines = preprocessedChart.split('\n');
          const rebuiltLines: string[] = ["graph TD"];
          for (const l of rawLines) {
            const trimmedL = l.trim();
            if (!trimmedL || /^(graph|flowchart)\b/i.test(trimmedL)) continue;

            const cleanLine = sanitizeFlowchartLine(trimmedL);
            if (cleanLine) {
              rebuiltLines.push(cleanLine);
            }

          }

          const level2Chart = rebuiltLines.join('\n');
          const level2Id = `mermaid-${Math.random().toString(36).substring(7)}`;

          mermaid.render(level2Id, level2Chart).then(({ svg }) => {
            if (svg.includes("Syntax error")) throw new Error("Mermaid syntax error SVG");
            if (ref.current) {
              ref.current.innerHTML = svg;
              setHasError(false);
            }

          }).catch(lastErr => {
            console.warn("Mermaid render fallback to visual concept sequence:", lastErr);
            setHasError(true);
          });
        });
      });
    }

  }, [preprocessedChart, handwritingFont, mode, penColor, isDarkMode]);

  if (hasError) {

    return (
      <div className={`my-8 border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden ${
        isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200 shadow-xs"
      }
`}>
        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-amber-200">Simplified Schematic</span>
        <div className="p-4 bg-slate-50 rounded-xl text-left text-xs font-mono text-slate-700 w-full overflow-x-auto border border-slate-200/80">
          <pre>{chart}</pre>
        </div>
      </div>);
  }


  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} className={`my-8 flex justify-center bg-white p-4 rounded-xl shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-[#E0E0D5] overflow-x-auto ${mode === 'student' ? 'border-dashed border-2 border-opacity-50' : ''} ${handwritingFont}`} />
    </div>);
}

function oklchToRgb(oklchStr: string): string {
  const match = oklchStr.match(/oklch\(\s*([\d\.]+%?)\s+([\d\.]+)\s+([\d\.]+)(?:\s*\/\s*([\d\.]+%?))?\s*\)/i);
  if (!match) return oklchStr;

  let l = parseFloat(match[1]);
  if (match[1].endsWith('%')) l /= 100;

  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

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

  let rLinear = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toSrgb = (val: number) => {
    if (val <= 0.0031308) return Math.max(0, Math.min(255, Math.round(12.92 * val * 255)));
    return Math.max(0, Math.min(255, Math.round((1.055 * Math.pow(val, 1 / 2.4) - 0.055) * 255)));
  };

  const r = toSrgb(rLinear);
  const g = toSrgb(gLinear);
  const b = toSrgb(bLinear);

  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("student");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{fileUri: string, mimeType: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingType, setGeneratingType] = useState<"notes" | "assessment" | "flashcards" | "question-bank" | "lesson-plan" | "video" | "ppt" | "">("");
  const [resultText, setResultText] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pptTheme, setPptTheme] = useState<"academic" | "professional" | "minimalist">("academic");
  const [resultType, setResultType] = useState<"notes" | "assessment" | "question-bank" | "lesson-plan" | "video" | "ppt" | "">("");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [flashcards, setFlashcards] = useState<{term: string, definition: string}[]>([]);
  const [lessonPlan, setLessonPlan] = useState<{
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
 | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [handwritingFont, setHandwritingFont] = useState("font-handwriting");
  const [flashcardThemeStyle, setFlashcardThemeStyle] = useState<"default" | "monochrome" | "pastel" | "high-contrast">("default");
  const [pageStyle, setPageStyle] = useState("ruled");
  const [penColor, setPenColor] = useState("blue");
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [focusArea, setFocusArea] = useState("Algorithms, step-by-step processes, and diagrams in student style");
    const [questionBankType, setQuestionBankType] = useState("all");
  const [questionBankBloomLevel, setQuestionBankBloomLevel] = useState("all");

  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eduSmart_darkMode") === "true";
    }

    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("eduSmart_darkMode", "true");
    }
 else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("eduSmart_darkMode", "false");
    }

  }, [isDarkMode]);



  // High-Capacity Book Library and Live Camera Scanner State
  const [inputType, setInputType] = useState<"upload" | "library" | "scan">("upload");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const notesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Extended state for Custom Books
  const [customBooks, setCustomBooks] = useState<any[]>([]);
  const [customBooksLoading, setCustomBooksLoading] = useState(false);
  
  // Library UI state
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookDept, setNewBookDept] = useState("MCA");
  const [newBookType, setNewBookType] = useState<"link" | "file">("link");
  const [newBookLink, setNewBookLink] = useState("");
  const [newBookFile, setNewBookFile] = useState<File | null>(null);
  const [newBookDesc, setNewBookDesc] = useState("");
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [addBookError, setAddBookError] = useState<string | null>(null);

  const defaultLibraryBooks = [
    // Classical books for backwards compatibility
    { id: "book:gatsby", title: "The Great Gatsby", author: "F. Scott Fitzgerald", desc: "A detailed exploration of wealth, love, obsession, and the American Dream.", department: "Arts" },
    { id: "book:frankenstein", title: "Frankenstein", author: "Mary Shelley", desc: "A legendary sci-fi tale examining creation, scientific ambition, and isolation.", department: "Science" },
    { id: "book:sherlock_holmes", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", desc: "Classic detective mysteries showcasing brilliant deduction and case analysis.", department: "Arts" },
    { id: "book:alice_in_wonderland", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", desc: "A whimsical journey through nonsense, dreams, and linguistic puzzles.", department: "Arts" },
    { id: "book:pride_and_prejudice", title: "Pride & Prejudice", author: "Jane Austen", desc: "A brilliant romantic comedy about social status, pride, and assumptions.", department: "Arts" },
    { id: "book:macbeth", title: "Macbeth", author: "William Shakespeare", desc: "A masterpiece tragedy examining raw political ambition, guilt, and fate.", department: "Arts" },
    
    // MCA (Master of Computer Applications)
    { id: "book:distributed_systems", title: "Distributed Systems: Concepts and Design", author: "George Coulouris", desc: "Comprehensive coverage of distributed system architectures, peer-to-peer systems, middleware, consensus, and cloud algorithms.", department: "MCA" },
    { id: "book:advanced_db", title: "Advanced Database Management Systems", author: "Raghu Ramakrishnan", desc: "Deep dive into query optimization, transaction management, indexing, and NoSQL/distributed database technologies.", department: "MCA" },
    
    // BCA (Bachelor of Computer Applications)
    { id: "book:cpp_oop", title: "Programming in C++ and Object-Oriented Design", author: "Bjarne Stroustrup", desc: "Foundational principles of object-oriented programming, classes, inheritance, polymorphism, memory management, and C++ design.", department: "BCA" },
    { id: "book:computer_networks", title: "Computer Networks & Internet Protocols", author: "Andrew S. Tanenbaum", desc: "Detailed exploration of network layers, routing protocols, TCP/UDP, and application-layer services.", department: "BCA" },
    
    // Engineering
    { id: "book:artificial_intelligence", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell & Peter Norvig", desc: "The definitive guide to rational agents, search, logic, machine learning, neural networks, and agent architectures.", department: "Engineering" },
    { id: "book:engineering_math", title: "Advanced Engineering Mathematics", author: "Erwin Kreyszig", desc: "Fourier analysis, partial differential equations, complex analysis, linear algebra, and numerical engineering methods.", department: "Engineering" },
    { id: "book:fluid_mechanics", title: "Fluid Mechanics & Thermodynamics", author: "Frank M. White", desc: "Fundamental principles of fluid properties, fluid statics, control volume analysis, pipe flow, drag, and lift.", department: "Engineering" },
    
    // Pharmacy
    { id: "book:medical_pharmacology", title: "Essentials of Medical Pharmacology", author: "K.D. Tripathi", desc: "Comprehensive drug actions, mechanisms, pharmacokinetics (ADME), clinical therapeutics, and toxicities.", department: "Pharmacy" },
    { id: "book:pharmaceutics", title: "Pharmaceutics: Formulations and Drug Delivery", author: "Michael E. Aulton", desc: "Dosage form design, biopharmaceutics, drug stability, physical pharmacy, and industrial manufacturing.", department: "Pharmacy" },
    
    // Commerce
    { id: "book:corporate_finance", title: "Principles of Corporate Finance", author: "Richard A. Brealey & Stewart C. Myers", desc: "Valuation models, capital budgeting, risk management, capital structure, and financial decision-making.", department: "Commerce" },
    { id: "book:financial_accounting", title: "Advanced Financial Accounting", author: "Theodore E. Christensen", desc: "Consolidations, foreign currency transactions, partnerships, segment reporting, and reporting standards.", department: "Commerce" },
    
    // Science
    { id: "book:brief_history_time", title: "A Brief History of Time & Cosmology", author: "Stephen Hawking", desc: "A journey through space-time, black holes, the big bang, quantum mechanics, and the search for a unified physical theory.", department: "Science" },
    { id: "book:organic_chemistry", title: "Organic Chemistry: Structure and Reactivity", author: "Robert T. Morrison & Robert N. Boyd", desc: "Detailed chemical structures, reaction mechanisms (substitution, elimination), synthesis pathways, and spectroscopy.", department: "Science" },
    
    // Arts
    { id: "book:story_of_art", title: "The Story of Art & Visual History", author: "E.H. Gombrich", desc: "The classic survey of art history, from prehistoric cave paintings and classical eras to Renaissance, Modern, and contemporary arts.", department: "Arts" },
    { id: "book:history_western_philosophy", title: "A History of Western Philosophy", author: "Bertrand Russell", desc: "A comprehensive analysis of philosophical thought from the pre-Socratics to 20th-century analytical philosophy.", department: "Arts" }
  ];

  const allLibraryBooks = [...customBooks, ...defaultLibraryBooks];
  const libraryBooks = allLibraryBooks;

  const getActiveBook = () => {
    if (!fileData || !fileData.fileUri) return null;
    return allLibraryBooks.find(b => b.id === fileData.fileUri || (b.fileUri && b.fileUri === fileData.fileUri));
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      // Wait for React to render the video element and stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

      }, 100);
    }
 catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please verify camera permissions or try on a device with a webcam.");
    }
 finally {
      setIsCameraLoading(false);
    }

  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }

  };

  const confirmScan = async () => {
    if (!capturedPhoto) return;
    setLoading(true);
    setError(null);
    setIsScannerOpen(false);
    
    try {
      const resBlob = await fetch(capturedPhoto);
      const blob = await resBlob.blob();
      const scannedFile = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(scannedFile);
      
      const formData = new FormData();
      formData.append("file", scannedFile);
      
      const uploadRes = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const textResponse = await uploadRes.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (!uploadRes.ok) {
        throw new Error(data.error || "Failed to process scanned image");
      }

      
      setFileData({ fileUri: data.fileUri, mimeType: data.mimeType });
      setResultText("");
      setResultType("");
            setFlashcards([]);
    }
 catch (err: any) {
      handleFetchError(err);
    }
 finally {
      setLoading(false);
      setCapturedPhoto(null);
    }

  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    setHistoryLoading(true);
    const q = query(
      collection(db, "users", user.uid, "documents"),
      orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        items.push({
          id: docSnapshot.id,
          title: data.title || "Untitled Document",
          type: data.type || "notes",
          fileUri: data.fileUri || "",
          mimeType: data.mimeType || "",
          resultText: data.resultText || "",

          flashcards: data.flashcards || [],
          lessonPlan: data.lessonPlan || null,
          focusArea: data.focusArea || "",
          createdAt: data.createdAt,
        });
      });
      setHistory(items);
      setHistoryLoading(false);
    }, (err) => {
      console.error("Error fetching document history:", err);
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCustomBooks([]);
      return;
    }

    setCustomBooksLoading(true);
    const q = query(
      collection(db, "users", user.uid, "books"),
      orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        items.push({
          id: docSnapshot.id,
          title: data.title || "Untitled Book",
          author: data.author || "Unknown Author",
          desc: data.desc || "",
          department: data.department || "MCA",
          link: data.link || "",
          fileUri: data.fileUri || "",
          mimeType: data.mimeType || "",
          createdAt: data.createdAt,
        });
      });
      setCustomBooks(items);
      setCustomBooksLoading(false);
    }, (err) => {
      console.error("Error fetching custom books:", err);
      setCustomBooksLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.fileUri && (item.fileUri.startsWith("book:") || item.fileUri.startsWith("link:") || customBooks.some(b => b.fileUri === item.fileUri))) {
      setInputType("library");
    }
 else if (item.title && item.title.startsWith("scan-")) {
      setInputType("scan");
    }
 else {
      setInputType("upload");
    }


    setFileData({ fileUri: item.fileUri, mimeType: item.mimeType });
    setResultText(item.resultText || "");
    setResultType(item.type as any);
        setFlashcards(item.flashcards || []);
    setLessonPlan(item.lessonPlan || null);
    setVideoData(item.videoData || null);
    if (item.focusArea) {
      setFocusArea(item.focusArea);
    }

  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "documents", id));
    }
 catch (err) {
      console.error("Error deleting document from history:", err);
    }

  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Store user data in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          createdAt: serverTimestamp()
        });
      }

    }
 catch (error) {
      console.error("Error signing in", error);
    }

  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (authLoading) {
    return (
      <div className={`flex h-screen items-center justify-center transition-colors ${isDarkMode ? "bg-[#181816]" : "bg-[#F5F5F0]"}`}>
        <Loader2 className={`animate-spin ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`} size={40} />
      </div>);
  }


  if (!user) {
    return (
      <div className={`flex h-screen items-center justify-center font-sans transition-colors ${isDarkMode ? "bg-[#181816] text-[#E0E0D5]" : "bg-[#F5F5F0] text-[#2D2D2A]"}`}>
        <div className={`p-10 rounded-[24px] border text-center max-w-md w-full relative transition-colors ${
          isDarkMode ? "bg-[#22221F] border-[#383832] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "bg-white border-[#E0E0D5] shadow-[0_4px_20px_rgba(90,90,64,0.05)]"
        }
`}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Late-Night Study Dark Mode"}
            className={`absolute top-4 right-4 p-2.5 rounded-full border transition-all ${
              isDarkMode 
                ? "bg-[#2D2D2A] border-[#4A4A3F] text-[#FACC15] hover:bg-[#383832]" 
                : "bg-[#FAF9F6] border-[#E0E0D5] text-[#5A5A40] hover:bg-[#E8E8E0]"
            }
`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className={`p-4 rounded-2xl inline-flex items-center justify-center mb-6 transition-colors ${isDarkMode ? "bg-[#2D2D2A] text-[#C2C2B0]" : "bg-[#E8E8E0] text-[#5A5A40]"}`}>
            <BookOpen size={48} />
          </div>
          <h1 className={`text-3xl font-bold font-serif mb-2 ${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}`}>Notivexa <span className={`italic font-medium ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>AI</span></h1>
          <p className="text-[#8A8A7A] mb-8">Sign in to access AI-powered learning tools, generate notes, flashcards, and presentations.</p>
          <AuthForm isDarkMode={isDarkMode} />
          
          <div className="my-6 text-[#8A8A7A] text-sm">Or</div>
          
          <button 
            onClick={handleSignIn}
            className="w-full bg-[#5A5A40] text-white py-3 px-6 rounded-full font-semibold flex items-center justify-center gap-3 hover:bg-opacity-90 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>);
  }


  const handleFetchError = (err: any) => {
    console.error(err);
    const msg = err?.message || String(err || "");
    if (msg.includes("<!doctype html>") || msg.includes("DOCTYPE") || msg.includes("<html>")) {
      setError("The server is temporarily updating or busy. Please wait a moment and try clicking the button again.");
    }
 else if (msg.toLowerCase().includes("failed to fetch")) {
      setError("Network connection issue: Could not connect to the server. Please check your connection and try again.");
    }
 else if (msg.includes("503") || msg.toLowerCase().includes("overloaded") || msg.toLowerCase().includes("high demand")) {
      setError("The AI model is currently experiencing high demand. Please wait a moment and try again.");
    }
 else {
      setError(msg || "An unexpected error occurred");
    }

  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setResultText("");
    setResultType("");
        setFlashcards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      
      setFileData({ fileUri: data.fileUri, mimeType: data.mimeType });

      if (user) {
        try {
          await addDoc(collection(db, "users", user.uid, "books"), {
            title: selectedFile.name,
            author: "Uploaded File",
            desc: "Uploaded via Quick Scan",
            department: "General",
            fileUri: data.fileUri,
            mimeType: data.mimeType,
            link: "",
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.error("Failed to save to history:", dbErr);
        }
      }
    }
 catch (err: any) {
      handleFetchError(err);
    }
 finally {
      setLoading(false);
    }

  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAddBookError("Please log in to add books.");
      return;
    }

    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      setAddBookError("Title and Author are required.");
      return;
    }


    setIsSavingBook(true);
    setAddBookError(null);

    try {
      let finalFileUri = "";
      let finalMimeType = "";

      if (newBookType === "file") {
        if (!newBookFile) {
          throw new Error("Please select a PDF file to upload.");
        }

        const formData = new FormData();
        formData.append("file", newBookFile);

        const res = await fetch("/api/upload-pdf", {
          method: "POST",
          body: formData,
        });
        const textResponse = await res.text();
        let data;
        try {
          data = JSON.parse(textResponse.trim());
        }
 catch (e) {
          if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server upload error: ${res.status}`);
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload book file.");
        }

        finalFileUri = data.fileUri;
        finalMimeType = data.mimeType;
      }
 else {
        if (!newBookLink.trim()) {
          throw new Error("Please enter a valid website link.");
        }

        if (!newBookLink.startsWith("http://") && !newBookLink.startsWith("https://")) {
          throw new Error("Website link must start with http:// or https://");
        }

        finalFileUri = "link:" + newBookLink.trim();
        finalMimeType = "text/html";
      }


      // Add to Firestore
      await addDoc(collection(db, "users", user.uid, "books"), {
        title: newBookTitle.trim(),
        author: newBookAuthor.trim(),
        desc: newBookDesc.trim(),
        department: newBookDept,
        fileUri: finalFileUri,
        mimeType: finalMimeType,
        link: newBookType === "link" ? newBookLink.trim() : "",
        createdAt: serverTimestamp()
      });

      // Clear form & close
      setNewBookTitle("");
      setNewBookAuthor("");
      setNewBookLink("");
      setNewBookFile(null);
      setNewBookDesc("");
      setIsAddBookOpen(false);
    }
 catch (err: any) {
      console.error("Add book error:", err);
      setAddBookError(err.message || "An unexpected error occurred while adding the book.");
    }
 finally {
      setIsSavingBook(false);
    }

  };

  const handleDeleteBook = async (bookId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this book from your library?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "books", bookId));
      }
 catch (err) {
        console.error("Error deleting book:", err);
        alert("Failed to delete book.");
      }

    }

  };

  const generateNotes = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("notes");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "notes");
      if (cached) {
        setResultText(cached.resultText || "");
        setResultType("notes");
                setFlashcards([]);
        if (cached.focusArea) {
          setFocusArea(cached.focusArea);
        }

        setLoading(false);
        setGeneratingType("");
        return;
      }


      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, focusArea: focusArea, mode: mode }),
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (data && data.error) throw new Error(data.error);
      if (!res.ok) throw new Error("Failed to generate notes");
      
      setResultText(data.result || "");
      setResultType("notes");
            setFlashcards([]);

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Study Notes",
          type: "notes",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: data.result || "",

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
        setResultText(cached.resultText || "");
        setResultType("assessment");
                setFlashcards([]);
        setLoading(false);
        setGeneratingType("");
        return;
      }


      const res = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, difficulty: "Medium", mode: mode }),
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (data && data.error) throw new Error(data.error);
      if (!res.ok) throw new Error("Failed to generate assessment");
      
      setResultText(data.result || "");
      setResultType("assessment");
            setFlashcards([]);

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Assessment Paper",
          type: "assessment",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: data.result || "",

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

  const generateQuestionBank = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("question-bank");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "question-bank" && item.questionBankType === questionBankType && item.questionBankBloomLevel === questionBankBloomLevel);
      if (cached) {
        setResultText(cached.resultText || "");
        setResultType("question-bank");
                setFlashcards([]);
        setLoading(false);
        setGeneratingType("");
        return;
      }


      const res = await fetch("/api/generate-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, questionType: questionBankType, bloomLevel: questionBankBloomLevel, mode: mode }),
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (data && data.error) throw new Error(data.error);
      if (!res.ok) throw new Error("Failed to generate question bank");
      
      setResultText(data.result || "");
      setResultType("question-bank");
            setFlashcards([]);

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Question Bank",
          type: "question-bank",
          questionBankType: questionBankType,
          questionBankBloomLevel: questionBankBloomLevel,
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: data.result || "",

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

  const generateLessonPlan = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("lesson-plan");
    setError(null);
    try {
      // Client-side cache check
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "lesson-plan");
      if (cached && cached.lessonPlan) {
        setLessonPlan(cached.lessonPlan);
        setResultText(cached.lessonPlan.fullMarkdownPlan || "");
        setResultType("lesson-plan");
                setFlashcards([]);
        if (cached.focusArea) {
          setFocusArea(cached.focusArea);
        }

        setLoading(false);
        setGeneratingType("");
        return;
      }


      const res = await fetch("/api/generate-lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileUri: fileData.fileUri, 
          mimeType: fileData.mimeType, 
          focusArea: focusArea,
          role: mode
        }),
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (data && data.error) throw new Error(data.error);
      if (!res.ok) throw new Error("Failed to generate lesson plan");
      
      const plan = data.lessonPlan;
      setLessonPlan(plan);
      setResultText(plan.fullMarkdownPlan || "");
      setResultType("lesson-plan");
            setFlashcards([]);

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Study Lesson Plan",
          type: "lesson-plan",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: plan.fullMarkdownPlan || "",

          flashcards: [],
          lessonPlan: plan,
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
        setFlashcards(cached.flashcards || []);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setResultText("");
                setLoading(false);
        setGeneratingType("");
        return;
      }


      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, mode: mode }),
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (data && data.error) throw new Error(data.error);
      if (!res.ok) throw new Error("Failed to generate flashcards");
      
      setFlashcards(data.flashcards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setResultText("");
      
      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Flashcard Set",
          type: "flashcards",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: "",

          flashcards: data.flashcards || [],
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

      slides.forEach((slide) => {
        const pptSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        
        // Title
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.4,
          w: "90%",
          h: 1.2,
          fontSize: 44,
          fontFace: fontName,
          bold: true,
          color: titleColor,
          valign: "middle"
        });

        // Content
        if (slide.bullets && slide.bullets.length > 0) {
          pptSlide.addText(
            slide.bullets.map(b => ({ text: b, options: { bullet: true, fontSize: 24, fontFace: fontName, color: contentColor, breakLine: true } })),
            {
              x: 0.5,
              y: 1.8,
              w: "90%",
              h: 3.5,
              valign: "top",
              lineSpacing: 32,
              margin: [0, 0, 0, 0]
            }
          );
        }


      });
      
      pres.writeFile({ fileName: `NotivexaAI_Presentation.pptx` });
    } catch (error) {
      console.error("Error creating PPTX", error);
      alert("Failed to create PPTX file.");
    }
  };
  const generatePPT = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("ppt");
    setError(null);

    try {
      // Client-side cache check
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "ppt"
      );
      if (cached) {
        setSlides(cached.slides || []);
        setResultType("ppt");
        setLoading(false);
        setGeneratingType("");
        return;
      }

      const response = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          focusArea: selectedDept !== "All" ? selectedDept : "",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate PPT");
      }

      const data = await response.json();
      if (data.ppt && data.ppt.slides) {
        setSlides(data.ppt.slides);
        setResultType("ppt");

        if (user) {
          await addDoc(collection(db, "users", user.uid, "documents"), {
            title: file ? file.name : "Presentation Slides",
            type: "ppt",
            fileUri: fileData.fileUri,
            mimeType: fileData.mimeType,
            resultText: "",
            flashcards: [],
            slides: data.ppt.slides,
            focusArea: selectedDept !== "All" ? selectedDept : "",
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setLoading(false);
      setGeneratingType("");
    }
  };
  const generateVideoExplanation = async () => {
    if (!fileData) return;
    setLoading(true);
    setGeneratingType("video");
    setError(null);
    try {
      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "video");
      if (cached) {
        setVideoData(cached.videoData || null);
        setResultType("video");
        setResultText("");
                setFlashcards([]);
        setLessonPlan(null);
        setLoading(false);
        setGeneratingType("");
        return;
      }


      const res = await fetch("/api/generate-video-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileUri: fileData.fileUri, 
          mimeType: fileData.mimeType,
          focusArea: focusArea
        }),
      });
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse.trim());
      }
 catch (e) {
        if (textResponse.trim().toLowerCase().startsWith("<!doctype html>")) { throw new Error("Server is temporarily unavailable (restarting). Please try again in a few seconds."); } throw new Error(`Server error: ${textResponse.slice(0, 100)}`);
      }

      
      if (data && data.error) throw new Error(data.error);
      if (!res.ok) throw new Error("Failed to generate video explanation");
      
      setVideoData(data.video || null);
      setResultType("video");
      setResultText("");
            setFlashcards([]);
      setLessonPlan(null);

      if (user) {
        await addDoc(collection(db, "users", user.uid, "documents"), {
          title: file ? file.name : "Lecture Video",
          type: "video",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,
          resultText: "",

          flashcards: [],
          videoData: data.video || null,
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


  const downloadMarkdown = () => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: "text/markdown;charset=utf-8" });
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

  const downloadHandwrittenPDF = async (fast: boolean = false) => {
    if (!notesRef.current) return;
    
    const originalGetComputedStyle = window.getComputedStyle;
    
    // Temporarily monkeypatch window.getComputedStyle to translate OKLCH colors to RGB/RGBA
    // because html2canvas does not support oklch() color spaces used by Tailwind v4.
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && val.includes('oklch')) {
                return val.replace(/oklch\(\s*[\d\.]+%?\s+[\d\.]+\s+[\d\.]+(?:\s*\/\s*[\d\.]+%?)?\s*\)/gi, (m) => oklchToRgb(m));
              }

              return val;
            };
          }

          
          const val = (target as any)[prop];
          if (typeof val === 'string' && val.includes('oklch')) {
            return val.replace(/oklch\(\s*[\d\.]+%?\s+[\d\.]+\s+[\d\.]+(?:\s*\/\s*[\d\.]+%?)?\s*\)/gi, (m) => oklchToRgb(m));
          }

          if (typeof val === 'function') {
            return val.bind(target);
          }

          return val;
        }

      });
    };
    
    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportStatus("Initializing pagination layout and preparing font canvases...");
      
      // Wait for fonts to be ready
      await document.fonts.ready;
      setExportProgress(15);
      setExportStatus("Positioning document nodes and formatting pages...");
      
      const element = notesRef.current;
      
      let elementsToPaginate: Element[] = [];
      const markdownContents = element.querySelectorAll('.markdown-content');
      if (markdownContents.length > 0) {
        markdownContents.forEach(container => {
          elementsToPaginate.push(...Array.from(container.children));
        });
      }
 else {
        const contentContainer = element.querySelector('.pl-8') || element;
        elementsToPaginate = Array.from(contentContainer.children);
      }

      
      const isStudent = mode === 'student';
      
      // Create a temporary workspace attached to the document body (positioned offscreen)
      const tempWorkspace = document.createElement("div");
      tempWorkspace.style.position = "absolute";
      tempWorkspace.style.top = "0";
      tempWorkspace.style.left = "-9999px";
      tempWorkspace.style.width = "794px";
      tempWorkspace.style.zIndex = "-9999";
      document.body.appendChild(tempWorkspace);
      
      const pageClass = `prose max-w-none ${isStudent ? `${handwritingFont} text-xl ${penColor === 'blue' ? 'text-[#1d4ed8]' : 'text-[#3A3A2F]'}` : 'font-sans text-[#4A4A3F]'}`;
      
      // Setup the first page
      let currentPage = document.createElement("div");
      currentPage.className = pageClass;
      Object.assign(currentPage.style, {
        width: "794px",
        minHeight: "1123px",
        maxHeight: "1123px",
        padding: isStudent ? "60px 40px 60px 80px" : "60px 60px 60px 60px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        backgroundColor: isStudent ? "#FDFDFB" : "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      });
      
      if (isStudent) {
        currentPage.style.backgroundImage = pageStyle === 'ruled' 
          ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)' 
          : pageStyle === 'box' 
            ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)'
            : 'none';
        currentPage.style.backgroundAttachment = 'local';
        currentPage.style.lineHeight = '32px';
      }

      
      const addDecorations = (pageElem: HTMLElement) => {
        if (isStudent) {
          if (pageStyle !== 'box') {
            const redLine = document.createElement("div");
            redLine.className = "absolute left-10 top-0 bottom-0 w-px bg-[#fee2e2]";
            pageElem.appendChild(redLine);
          }

          const dotsContainer = document.createElement("div");
          dotsContainer.className = "absolute bottom-8 right-10 flex gap-2";
          dotsContainer.innerHTML = `
            <div class="w-2 h-2 rounded-full bg-[#bfdbfe]"></div>
            <div class="w-2 h-2 rounded-full bg-[#dbeafe]"></div>
          `;
          pageElem.appendChild(dotsContainer);
        }

      };
      
      addDecorations(currentPage);
      
      let currentContentWrapper = document.createElement("div");
      currentContentWrapper.className = isStudent ? "pl-8 block relative z-10" : "block relative z-10";
      currentContentWrapper.style.maxWidth = "100%";
      currentContentWrapper.style.boxSizing = "border-box";
      currentPage.appendChild(currentContentWrapper);
      
      tempWorkspace.appendChild(currentPage);
      const pages: HTMLElement[] = [currentPage];
      
      setExportProgress(30);
      setExportStatus("Distributing page contents...");
      
      // We will iterate and place child nodes on pages
      for (const child of elementsToPaginate) {
        // Skip some container wrappers if they are empty
        if (child.tagName.toLowerCase() === 'div' && child.children.length === 0 && !child.textContent?.trim()) {
          continue;
        }

        
        const tagName = child.tagName?.toLowerCase() || '';
        const hasPageBreakClass = child.classList?.contains('page-break-before') || child.querySelector?.('.page-break-before') !== null;
        // Check if this child is a primary section header (h1 or h2) or contains one
        const isHighLevelHeading = tagName === 'h1' || child.querySelector?.('h1') !== null;
        
        // Force page break proactively if a major heading/section or custom break class is met, but only if we already have content on the current page
        const shouldForcePageBreak = (isHighLevelHeading || hasPageBreakClass) && currentContentWrapper.children.length > 0;
        
        if (shouldForcePageBreak) {
          currentPage = document.createElement("div");
          currentPage.className = pageClass;
          Object.assign(currentPage.style, {
            width: "794px",
            minHeight: "1123px",
            maxHeight: "1123px",
            padding: isStudent ? "60px 40px 60px 80px" : "60px 60px 60px 60px",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            backgroundColor: isStudent ? "#FDFDFB" : "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          });
          
          if (isStudent) {
            currentPage.style.backgroundImage = pageStyle === 'ruled' 
              ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)' 
              : pageStyle === 'box' 
                ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)'
                : 'none';
            currentPage.style.backgroundAttachment = 'local';
            currentPage.style.lineHeight = '32px';
          }

          
          addDecorations(currentPage);
          
          currentContentWrapper = document.createElement("div");
          currentContentWrapper.className = isStudent ? "pl-8 block relative z-10" : "block relative z-10";
          currentContentWrapper.style.maxWidth = "100%";
          currentContentWrapper.style.boxSizing = "border-box";
          currentPage.appendChild(currentContentWrapper);
          
          tempWorkspace.appendChild(currentPage);
          pages.push(currentPage);
        }

        
        const clonedChild = child.cloneNode(true) as HTMLElement;
        
        // Ensure child contents are sized properly
        const childElements = clonedChild.querySelectorAll('pre, table, svg, img');
        childElements.forEach(el => {
          (el as HTMLElement).style.maxWidth = '100%';
          (el as HTMLElement).style.boxSizing = 'border-box';
        });
        
        currentContentWrapper.appendChild(clonedChild);
        
        // Measure height of content in the wrapper
        const currentHeight = currentContentWrapper.scrollHeight;
        const maxHeightAllowed = 940; // leaving margin for top/bottom padding
        
        if (currentHeight > maxHeightAllowed && currentContentWrapper.children.length > 1) {
          // Doesn't fit on this page, remove it and start a new page
          currentContentWrapper.removeChild(clonedChild);
          
          currentPage = document.createElement("div");
          currentPage.className = pageClass;
          Object.assign(currentPage.style, {
            width: "794px",
            minHeight: "1123px",
            maxHeight: "1123px",
            padding: isStudent ? "60px 40px 60px 80px" : "60px 60px 60px 60px",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            backgroundColor: isStudent ? "#FDFDFB" : "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          });
          
          if (isStudent) {
            currentPage.style.backgroundImage = pageStyle === 'ruled' 
              ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)' 
              : pageStyle === 'box' 
                ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)'
                : 'none';
            currentPage.style.backgroundAttachment = 'local';
            currentPage.style.lineHeight = '32px';
          }

          
          addDecorations(currentPage);
          
          currentContentWrapper = document.createElement("div");
          currentContentWrapper.className = isStudent ? "pl-8 block relative z-10" : "block relative z-10";
          currentContentWrapper.style.maxWidth = "100%";
          currentContentWrapper.style.boxSizing = "border-box";
          currentPage.appendChild(currentContentWrapper);
          
          tempWorkspace.appendChild(currentPage);
          pages.push(currentPage);
          
          // Add to the new page
          currentContentWrapper.appendChild(clonedChild);
        }

      }


      // Extract all headings from content pages
      const allHeadings: { text: string; level: number; contentPageIdx: number }[] = [];
      pages.forEach((page, pageIdx) => {
        const headingsOnPage = page.querySelectorAll('h1, h2, h3');
        headingsOnPage.forEach(h => {
          const hTag = h.tagName.toLowerCase();
          const txt = h.textContent?.trim() || '';
          if (txt) {
            allHeadings.push({
              text: txt,
              level: parseInt(hTag.substring(1)),
              contentPageIdx: pageIdx
            });
          }

        });
      });

      // Format Table of Contents Page
      const tocPage = document.createElement("div");
      tocPage.className = pageClass;
      Object.assign(tocPage.style, {
        width: "794px",
        minHeight: "1123px",
        maxHeight: "1123px",
        padding: isStudent ? "60px 40px 60px 80px" : "60px 60px 60px 60px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        backgroundColor: isStudent ? "#FDFDFB" : "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      });

      if (isStudent) {
        tocPage.style.backgroundImage = pageStyle === 'ruled' 
          ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)' 
          : pageStyle === 'box' 
            ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)'
            : 'none';
        tocPage.style.backgroundAttachment = 'local';
        tocPage.style.lineHeight = '32px';
      }


      addDecorations(tocPage);

      const tocContentWrapper = document.createElement("div");
      tocContentWrapper.className = isStudent ? "pl-8 flex flex-col gap-6 relative z-10" : "flex flex-col gap-6 relative z-10";
      tocContentWrapper.style.maxWidth = "100%";
      tocContentWrapper.style.boxSizing = "border-box";
      tocPage.appendChild(tocContentWrapper);

      const tocTitle = document.createElement("div");
      if (isStudent) {
        tocTitle.className = `text-3xl font-bold border-b pb-2 ${penColor === 'blue' ? 'border-[#bfdbfe] text-[#1d4ed8]' : 'border-gray-200 text-gray-800'}`;
        if (handwritingFont) {
          tocTitle.style.fontFamily = handwritingFont;
        }

        tocTitle.textContent = "Table of Contents";
      }
 else {
        tocTitle.className = "text-2xl font-sans font-bold text-gray-900 border-b border-gray-200 pb-2";
        tocTitle.textContent = "Table of Contents";
      }

      tocContentWrapper.appendChild(tocTitle);

      // Adaptive filtering of headings to prevent overflow on 1 page (limit to max 22 entries)
      let filteredHeadings = allHeadings;
      if (filteredHeadings.length > 22) {
        filteredHeadings = allHeadings.filter(h => h.level <= 2);
        if (filteredHeadings.length > 22) {
          filteredHeadings = allHeadings.filter(h => h.level === 1);
          if (filteredHeadings.length > 22) {
            filteredHeadings = filteredHeadings.slice(0, 22);
          }

        }

      }


      const tocListContainer = document.createElement("div");
      tocListContainer.className = "flex flex-col gap-4";
      tocListContainer.style.width = "100%";

      if (filteredHeadings.length === 0) {
        const noHeadings = document.createElement("div");
        noHeadings.className = "text-gray-400 italic text-sm";
        noHeadings.textContent = "No sections to display.";
        tocListContainer.appendChild(noHeadings);
      }
 else {
        filteredHeadings.forEach(heading => {
          const entryRow = document.createElement("div");
          entryRow.className = "flex items-baseline justify-between w-full";
          
          let paddingLeft = "0px";
          let fontSize = isStudent ? "18px" : "15px";
          let fontWeight = "normal";
          let colorClass = "text-gray-700";
          
          if (heading.level === 1) {
            paddingLeft = "0px";
            fontSize = isStudent ? "20px" : "16px";
            fontWeight = "bold";
            colorClass = isStudent 
              ? (penColor === 'blue' ? 'text-[#1d4ed8]' : 'text-gray-900') 
              : 'text-gray-900';
          }
 else if (heading.level === 2) {
            paddingLeft = "24px";
            fontSize = isStudent ? "18px" : "14px";
            fontWeight = "medium";
            colorClass = "text-gray-800";
          }
 else if (heading.level === 3) {
            paddingLeft = "48px";
            fontSize = isStudent ? "16px" : "13px";
            colorClass = "text-gray-600";
          }

          
          entryRow.style.paddingLeft = paddingLeft;
          entryRow.style.fontSize = fontSize;
          if (isStudent && handwritingFont) {
            entryRow.style.fontFamily = handwritingFont;
          }

          
          const titleSpan = document.createElement("span");
          titleSpan.className = `${fontWeight === 'bold' ? 'font-bold' : fontWeight === 'medium' ? 'font-medium' : 'font-normal'} ${colorClass}`;
          titleSpan.textContent = heading.text;
          
          const dotsSpan = document.createElement("span");
          dotsSpan.className = "flex-1 border-b border-dotted mx-2";
          if (isStudent && penColor === 'blue') {
            dotsSpan.className += " border-[#bfdbfe]";
          }
 else {
            dotsSpan.className += " border-gray-300";
          }

          dotsSpan.style.marginBottom = "4px";
          
          const pageSpan = document.createElement("span");
          pageSpan.className = `font-bold ${colorClass}`;
          pageSpan.textContent = String(heading.contentPageIdx + 2); // Shift by 1 for 1-based index and by 1 for TOC page itself
          
          entryRow.appendChild(titleSpan);
          entryRow.appendChild(dotsSpan);
          entryRow.appendChild(pageSpan);
          
          tocListContainer.appendChild(entryRow);
        });
      }


      tocContentWrapper.appendChild(tocListContainer);

      // Insert TOC page as the first page of the temp workspace and pages list
      tempWorkspace.insertBefore(tocPage, tempWorkspace.firstChild);
      pages.unshift(tocPage);

      // Function to dynamically append beautifully styled page numbers to each page
      const addPageNumber = (pageElem: HTMLElement, pageNum: number) => {
        if (isStudent) {
          const pageNumDiv = document.createElement("div");
          pageNumDiv.className = `absolute bottom-6 left-12 text-xs font-semibold ${penColor === 'blue' ? 'text-[#3b82f6]' : 'text-gray-400'}`;
          if (handwritingFont) {
            pageNumDiv.style.fontFamily = handwritingFont;
          }

          pageNumDiv.textContent = `Page ${pageNum}`;
          pageElem.appendChild(pageNumDiv);
        }
 else {
          const pageNumDiv = document.createElement("div");
          pageNumDiv.className = "absolute bottom-6 left-10 right-10 flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-2";
          pageNumDiv.innerHTML = `
            <span>EDU-SMART ACADEMIC PORTAL</span>
            <span>Page ${pageNum}</span>
          `;
          pageElem.appendChild(pageNumDiv);
        }

      };

      // Add page numbers to all formatted pages (including TOC page itself)
      pages.forEach((page, idx) => {
        addPageNumber(page, idx + 1);
      });
      
      // Format SVG elements on each page to make sure they render clearly
      pages.forEach(page => {
        const svgElements = page.querySelectorAll('svg');
        svgElements.forEach(svg => {
          const s = svg as any;
          const bbox = s.getBoundingClientRect();
          if (bbox.width && bbox.height) {
            s.setAttribute('width', bbox.width + 'px');
            s.setAttribute('height', bbox.height + 'px');
          }

          s.style.maxWidth = '100%';
          s.style.height = 'auto';
          s.style.display = 'block';
          s.style.margin = '0 auto';
        });
      });
      
      setExportProgress(45);
      setExportStatus(`Rasterizing formatted pages (0 of ${pages.length})...`);
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const numPages = pages.length;
      for (let i = 0; i < numPages; i++) {
        const pageElem = pages[i];
        
        setExportProgress(Math.round(45 + (i / numPages) * 45));
        setExportStatus(`Rasterizing page ${i + 1} of ${numPages}...`);
        
        const canvas = await html2canvas(pageElem, {
          scale: fast ? 1.0 : 3.0, // Optimized scale
          useCORS: true,
          backgroundColor: isStudent ? "#FDFDFB" : "#ffffff",
          width: 794,
          height: 1123,
        });
        
        const imgData = canvas.toDataURL("image/jpeg", 0.8); // Use JPEG with lower quality to reduce size
        
        if (i > 0) {
          pdf.addPage();
        }

        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pageHeight);
      }

      
      // Cleanup the temporary workspace
      document.body.removeChild(tempWorkspace);
      
      setExportProgress(95);
      setExportStatus("Finalizing PDF structure and saving...");
      
      pdf.save("Student_Notes.pdf");
      setExportProgress(100);
      setExportStatus("Export Complete!");
    }
 catch (err: any) {
      console.error("PDF export failed:", err);
      window.print();
    }
 finally {
      window.getComputedStyle = originalGetComputedStyle;
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 800);
    }

  };


  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#181816] text-[#E0E0D5] dark" : "bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 text-slate-800"}`}>
      
      {/* Sidebar (Streamlit style) */}
      <div className={`w-72 border-r flex flex-col h-full z-10 transition-colors duration-300 ${
        isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5] shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "bg-white/95 backdrop-blur-md border-slate-200/80 text-slate-800 shadow-[0_4px_25px_rgba(15,23,42,0.06)]"
      }
`}>
        
        {/* Fixed Header */}
        <div className={`p-6 pb-4 border-b shrink-0 flex items-center justify-between transition-colors ${isDarkMode ? "border-[#383832]" : "border-slate-200/80"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all ${isDarkMode ? "bg-[#2D2D2A] text-[#C2C2B0]" : "bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-600 text-white shadow-md shadow-sky-500/25"}`}>
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-serif transition-colors ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                Notivexa <span className={`italic font-extrabold ${isDarkMode ? "text-[#C2C2B0]" : "bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent"}`}>AI</span>
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Late-Night Study Dark Mode"}
            className={`p-2.5 rounded-full border transition-all flex items-center justify-center ${
              isDarkMode 
                ? "bg-[#2D2D2A] border-[#4A4A3F] text-[#FACC15] hover:bg-[#383832] shadow-sm" 
                : "bg-white border-slate-200 text-amber-600 hover:bg-slate-50 shadow-xs"
            }
`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Scrollable middle container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 scrollbar-thin">
          
          {/* Late-Night Study Mode Quick Switch */}
          <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
            isDarkMode 
              ? "bg-[#2A2A26] border-[#45453B]" 
              : "bg-gradient-to-r from-sky-50/80 to-indigo-50/50 border-sky-200/60 shadow-xs"
          }
`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? "bg-[#383832] text-[#FACC15]" : "bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs"}`}>
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div>
                <span className={`text-xs font-bold block transition-colors ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
                  {isDarkMode ? "Late-Night Mode" : "Daylight Mode"}
                </span>
                <span className="text-[10px] text-slate-500">Eye-soothing study contrast</span>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                isDarkMode ? "bg-[#5A5A40]" : "bg-sky-500"
              }
`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? "translate-x-6" : "translate-x-1"
                }
`}
              />
            </button>
          </div>

          {/* Study Material Source */}
          <div>
            <label className="text-xs font-semibold text-[#8A8A7A] uppercase tracking-widest mb-3 block">
              Study Material Source
            </label>
            
            {/* Custom Tabs */}
            <div className={`flex p-1 rounded-full border mb-4 transition-colors ${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-slate-100/90 border-slate-200/80"}`}>
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
                  setInputType("library");
                  setFile(null);
                  setFileData(null);
                }
}
                className={`flex-1 py-2 px-1 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${inputType === "library" ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20" : isDarkMode ? "text-[#A1A194] hover:text-[#E0E0D5]" : "text-slate-600 hover:text-slate-900"}`}
              >
                <BookOpen size={12} /> E-Library
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
              <label className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group block ${
                isDarkMode 
                  ? "border-[#4A4A3F] bg-[#22221F] hover:bg-[#2A2A26]" 
                  : "border-[#D1D1C4] bg-[#FAF9F6] hover:bg-[#F0F0E8]"
              }
`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isDarkMode ? "bg-[#383832]" : "bg-[#E8E8E0]"}`}>
                  <Upload className={`${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"} transition-colors`} size={16} />
                </div>
                <span className={`text-xs font-semibold ${isDarkMode ? "text-[#E0E0D5]" : "text-[#3A3A2F]"}`}>Choose E-Book or Scan</span>
                <span className="text-[10px] text-[#8A8A7A] mt-1 truncate max-w-[180px]">{file ? file.name : "PDF, JPEG, or PNG (Limit 50MB)"}</span>
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUpload} />
              </label>)}

            {inputType === "library" && (
              <div className="space-y-4">
                {/* Search & Add Book Row */}
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
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
                  <button
                    onClick={() => {
                      setIsAddBookOpen(!isAddBookOpen);
                      setAddBookError(null);
                    }
}
                    className="flex items-center gap-1.5 py-2 px-3 bg-[#5A5A40] text-white rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all shadow-sm shrink-0"
                  >
                    {isAddBookOpen ? "Cancel" : "+ Add Book"}
                  </button>
                </div>

                {/* Add Custom Book Form Panel */}
                {isAddBookOpen && (
                  <form onSubmit={handleAddBook} className="bg-[#FAF9F6] p-4 rounded-xl border border-[#D1D1C4] space-y-3 relative text-left">
                    <h3 className="text-xs font-bold text-[#3A3A2F] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#5A5A40]" /> Add Book to Library
                    </h3>
                    
                    {addBookError && (
                      <div className="p-2.5 bg-red-50 text-red-700 text-[11px] rounded-lg border border-red-200 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {addBookError}
                      </div>)}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Book Title*</label>
                        <input
                          type="text"
                          required
                          value={newBookTitle ?? ""}
                          onChange={(e) => setNewBookTitle(e.target.value)}
                          placeholder="e.g. Database Concepts"
                          className="w-full text-xs bg-white border border-[#D1D1C4] rounded-lg p-2 text-[#3A3A2F] outline-none focus:border-[#5A5A40] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Author*</label>
                        <input
                          type="text"
                          required
                          value={newBookAuthor ?? ""}
                          onChange={(e) => setNewBookAuthor(e.target.value)}
                          placeholder="e.g. Silberschatz"
                          className="w-full text-xs bg-white border border-[#D1D1C4] rounded-lg p-2 text-[#3A3A2F] outline-none focus:border-[#5A5A40] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Department*</label>
                        <select
                          value={newBookDept ?? ""}
                          onChange={(e) => setNewBookDept(e.target.value)}
                          className="w-full text-xs bg-white border border-[#D1D1C4] rounded-lg p-2 text-[#3A3A2F] outline-none focus:border-[#5A5A40] transition-all"
                        >
                          <option value="MCA">MCA</option>
                          <option value="BCA">BCA</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Science">Science</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Source Type</label>
                        <div className="flex bg-[#E8E8E0] p-0.5 rounded-lg border border-[#D1D1C4]">
                          <button
                            type="button"
                            onClick={() => setNewBookType("link")}
                            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${newBookType === "link" ? "bg-white text-[#3A3A2F] shadow-sm" : "text-[#8A8A7A] hover:text-[#5A5A40]"}`}
                          >
                            Website Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewBookType("file")}
                            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${newBookType === "file" ? "bg-white text-[#3A3A2F] shadow-sm" : "text-[#8A8A7A] hover:text-[#5A5A40]"}`}
                          >
                            PDF File
                          </button>
                        </div>
                      </div>
                    </div>

                    {newBookType === "link" ? (
                      <div>
                        <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Website URL*</label>
                        <input
                          type="url"
                          required={newBookType === "link"}
                          value={newBookLink ?? ""}
                          onChange={(e) => setNewBookLink(e.target.value)}
                          placeholder="https://example.com/materials.html"
                          className="w-full text-xs bg-white border border-[#D1D1C4] rounded-lg p-2 text-[#3A3A2F] outline-none focus:border-[#5A5A40] transition-all font-mono"
                        />
                        <span className="text-[9px] text-[#8A8A7A] mt-1 block">Our AI system will fetch and summarize web text in real-time.</span>
                      </div>) : (
                      <div>
                        <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Upload PDF Document*</label>
                        <input
                          type="file"
                          required={newBookType === "file"}
                          accept="application/pdf"
                          onChange={(e) => setNewBookFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-[#3A3A2F]"
                        />
                      </div>)}

                    <div>
                      <label className="text-[10px] font-bold text-[#8A8A7A] block mb-1">Short Description / Syllabus Notes</label>
                      <textarea
                        value={newBookDesc ?? ""}
                        onChange={(e) => setNewBookDesc(e.target.value)}
                        placeholder="Topics covered, target semester, study outline..."
                        rows={2}
                        className="w-full text-xs bg-white border border-[#D1D1C4] rounded-lg p-2 text-[#3A3A2F] outline-none focus:border-[#5A5A40] transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingBook}
                      className="w-full bg-[#5A5A40] hover:bg-opacity-95 disabled:bg-[#8A8A7A] text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isSavingBook ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Uploading & Processing...
                        </>) : (
                        "Save to Library")}
                    </button>
                  </form>)}

                {/* Department Filters Tab List */}
                <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
                  {["All", "MCA", "BCA", "Engineering", "Pharmacy", "Commerce", "Science", "Arts", "My Uploads"].map((dept) => {
                    const isActive = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all shrink-0 border ${isActive ? "bg-[#5A5A40] border-[#5A5A40] text-white" : "bg-[#FAF9F6] border-[#E0E0D5] text-[#6A6A5A] hover:bg-[#E8E8E0]"}`}
                      >
                        {dept}
                      </button>);
                  })}
                </div>

                {/* Books Display Grid */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {customBooksLoading && (
                    <div className="p-6 text-center text-xs text-[#8A8A7A] flex flex-col items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-[#5A5A40]" /> Loading Custom Library...
                    </div>)}

                  {!customBooksLoading && allLibraryBooks.filter(bk => {
                    if (selectedDept !== "All") {
                      if (selectedDept === "My Uploads") {
                        if (bk.id.startsWith("book:")) return false;
                      }
 else {
                        if (bk.department !== selectedDept) return false;
                      }

                    }

                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      return bk.title.toLowerCase().includes(q) || bk.author.toLowerCase().includes(q) || (bk.desc && bk.desc.toLowerCase().includes(q));
                    }

                    return true;
                  }).length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8A8A7A] bg-[#FAF9F6] rounded-xl border border-dashed border-[#D1D1C4]">
                      No books found in this category.
                    </div>) : (
                    allLibraryBooks.filter(bk => {
                      if (selectedDept !== "All") {
                        if (selectedDept === "My Uploads") {
                          if (bk.id.startsWith("book:")) return false;
                        }
 else {
                          if (bk.department !== selectedDept) return false;
                        }

                      }

                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        return bk.title.toLowerCase().includes(q) || bk.author.toLowerCase().includes(q) || (bk.desc && bk.desc.toLowerCase().includes(q));
                      }

                      return true;
                    }).map((bk) => {
                      const isSelected = fileData?.fileUri === bk.id || (bk.fileUri && fileData?.fileUri === bk.fileUri);
                      const isCustom = !bk.id.startsWith("book:");
                      
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
                              {isCustom && bk.link && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 flex items-center gap-0.5">
                                  🔗 Web Link
                                </span>)}
                              {isCustom && !bk.link && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 flex items-center gap-0.5">
                                  📄 Custom Upload
                                </span>)}
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
                              </p>)}
                          </div>

                          <div className="flex gap-1.5 items-center mt-1">
                            <button
                              onClick={() => {
                                setFileData({ fileUri: bk.fileUri || bk.id, mimeType: bk.mimeType || "text/plain" });
                                setFile(new File([], `[Library Book] ${bk.title}`));
                                setResultText("");
                                setResultType("");
                                                                setFlashcards([]);
                              }
}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${isSelected ? "bg-[#5A5A40] text-white shadow-sm" : "border border-[#5A5A40] text-[#5A5A40] hover:bg-[#FAF9F0]"}`}
                            >
                              {isSelected ? "📖 Selected for Study" : "📖 Study Book"}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                // Create simulated or URL text blob download
                                const textContent = `
=========================================
STUDY BOOK COMPANION: ${bk.title.toUpperCase()}
Author: ${bk.author}
Department: ${bk.department}
Source: ${bk.link || 'Preset Library Book'}
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
                              }
}
                              className="py-1.5 px-2 border border-[#8A8A7A] text-[#8A8A7A] hover:text-[#5A5A40] hover:border-[#5A5A40] rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 shrink-0"
                              title="Download study companion text"
                            >
                              <Download size={11} />
                            </button>

                            {isCustom && bk.link && (
                              <a
                                href={bk.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2 border border-[#8A8A7A] text-[#8A8A7A] hover:text-[#5A5A40] hover:border-[#5A5A40] rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 shrink-0"
                                title="Open original link"
                              >
                                <ExternalLink size={11} />
                              </a>)}

                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBook(bk.id)}
                                className="py-1.5 px-2 border border-red-200 text-red-500 hover:text-red-700 hover:border-red-400 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center shrink-0"
                                title="Delete from library"
                              >
                                <Trash2 size={11} />
                              </button>)}
                          </div>
                        </div>);
                    }))}
                </div>
              </div>)}

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



          {/* Study Focus */}
          <div>
            <label className="text-xs font-semibold text-[#8A8A7A] uppercase tracking-widest mb-3 block">
              Study Focus / Custom Prompt
            </label>
            <textarea
              value={focusArea ?? ""}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="e.g. Algorithms, step-by-step processes, and diagrams in student style"
              className="w-full text-xs bg-[#FAF9F6] border border-[#D1D1C4] rounded-xl p-3 text-[#3A3A2F] outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all resize-none h-20 font-sans"
            />
          </div>

          {/* Actions */}
          <div>
            <label className="text-xs font-semibold text-[#8A8A7A] uppercase tracking-widest mb-3 block">
              Actions
            </label>
            
            <div className="space-y-3">
              {mode === "student" ? (
                <>
                  
                  <button
                    onClick={generateNotes}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "notes" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    Generate Summary
                  </button>
                  <button
                    onClick={generateLessonPlan}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99]"
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
                  <div className={`p-4 rounded-2xl space-y-3.5 shadow-sm mt-3 border transition-colors ${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/40 border-emerald-200/90 shadow-emerald-500/5"}`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}`}>
                        <GraduationCap size={18} className="text-[#059669]" />
                        <span className={`font-serif text-sm font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}`}>
                          Question Bank Generator
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold ${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}`}>
                        Question Type Configuration
                      </label>
                      <select 
                        value={questionBankType} 
                        onChange={(e) => setQuestionBankType(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-[#059669]/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                      >
                        <option value="all">All Types (50+ each)</option>
                        <option value="mcq">Multiple Choice (50+ MCQs)</option>
                        <option value="short">Short Answer (50+ Questions)</option>
                        <option value="long">Long Answer (50+ Questions)</option>
                      </select>
                    </div>

                    <button
                      onClick={generateQuestionBank}
                      disabled={!fileData || loading}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading && generatingType === "question-bank" ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                      Generate Question Bank
                    </button>
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
                    onClick={generateLessonPlan}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99]"
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
      {/* Main Content Area */}
      <div className={`flex-1 overflow-auto p-8 relative transition-colors duration-300 ${isDarkMode ? "bg-[#181816]" : "bg-[#F5F5F0]"}`}>
        <div className="absolute top-4 right-4 z-20">
          <UserProfile user={user} isDarkMode={isDarkMode} />
        </div>
        <div className="mb-8">
          <Chatbot fileUri={fileData?.fileUri} mimeType={fileData?.mimeType} isDarkMode={isDarkMode} embedded={false} />
        </div>
        <div className="max-w-4xl mx-auto space-y-8">
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
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-[#EF4444] text-white hover:bg-[#DC2626] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={14} />
                    Reload Portal
                  </button>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-[#EF4444] border border-[#FCA5A5] hover:bg-[#FEE2E2] px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs inline-flex cursor-pointer shadow-sm"
                  >
                    <ExternalLink size={14} />
                    Open in New Tab
                  </a>
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

          {!resultText && !flashcards.length && !videoData && (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center relative overflow-hidden py-20 px-6 rounded-3xl shadow-sm my-2 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 border border-indigo-100/50">
              {/* Scattered Vector Open Book Illustrations & Academic Symbols matching reference design */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10">
                {/* Top Left Book */}
                <div className="absolute top-12 left-12 -rotate-12 transform hover:scale-105 transition-transform duration-500 opacity-45 text-indigo-400/80 p-4 bg-white/70 rounded-2xl shadow-xs backdrop-blur-xs flex items-center justify-center">
                  <BookOpen size={56} strokeWidth={1.5} />
                </div>
                {/* Top Right Book */}
                <div className="absolute top-16 right-16 rotate-12 transform hover:scale-105 transition-transform duration-500 opacity-45 text-sky-500/80 p-4 bg-white/70 rounded-2xl shadow-xs backdrop-blur-xs flex items-center justify-center">
                  <BookOpen size={64} strokeWidth={1.5} />
                </div>
                {/* Bottom Left Book */}
                <div className="absolute bottom-16 left-16 rotate-6 transform hover:scale-105 transition-transform duration-500 opacity-45 text-violet-500/80 p-5 bg-white/70 rounded-2xl shadow-xs backdrop-blur-xs flex items-center justify-center">
                  <BookOpen size={72} strokeWidth={1.5} />
                </div>
                {/* Bottom Right Book */}
                <div className="absolute bottom-12 right-20 -rotate-6 transform hover:scale-105 transition-transform duration-500 opacity-45 text-indigo-500/80 p-5 bg-white/70 rounded-2xl shadow-xs backdrop-blur-xs flex items-center justify-center">
                  <BookOpen size={72} strokeWidth={1.5} />
                </div>
                {/* Mid Right Book */}
                <div className="absolute top-1/2 right-10 rotate-15 transform -translate-y-1/2 opacity-35 text-sky-400/80 p-3 bg-white/60 rounded-2xl shadow-xs backdrop-blur-xs">
                  <BookOpen size={48} strokeWidth={1.5} />
                </div>
                {/* Mid Left Book */}
                <div className="absolute top-1/2 left-8 -rotate-12 transform -translate-y-1/2 opacity-35 text-indigo-400/80 p-3 bg-white/60 rounded-2xl shadow-xs backdrop-blur-xs">
                  <BookOpen size={44} strokeWidth={1.5} />
                </div>
                {/* Additional floating book symbols and academic accents */}
                <div className="absolute top-28 left-48 text-indigo-300 font-bold opacity-60 text-lg">+</div>
                <div className="absolute top-36 right-44 text-sky-400 font-bold opacity-60 text-lg">+</div>
                <div className="absolute bottom-36 left-40 text-violet-400 font-bold opacity-60 text-lg">+</div>
                <div className="absolute top-24 left-1/3 text-2xl opacity-20">📖</div>
                <div className="absolute bottom-28 right-1/3 text-2xl opacity-20">📚</div>
                <div className="absolute top-1/3 right-24 w-2 h-2 rounded-full bg-sky-400 opacity-40"></div>
                <div className="absolute bottom-1/3 left-24 w-3 h-3 rounded-full bg-indigo-400 opacity-30"></div>
              </div>

              {/* Floating ambient glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-400/15 via-indigo-400/15 to-violet-400/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

              <div className="w-20 h-20 bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-600 rounded-[28px] shadow-xl shadow-sky-500/25 text-white flex items-center justify-center mb-6 transform hover:scale-105 transition-all">
                <BookOpen size={38} />
              </div>

              <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 mb-3 tracking-tight">
                Welcome to <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Notivexa AI</span>
              </h2>
              <p className="text-slate-600 text-sm md:text-base max-w-xl mb-8 leading-relaxed">
                Your intelligent multi-modal academic companion. Generate interactive presentations, handwritten notes, flashcards, and video explainers instantly.
              </p>

              {/* Quick Feature Badges */}
              <div className="flex flex-wrap justify-center gap-3 max-w-xl mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 border border-sky-200/80 shadow-xs text-xs font-semibold text-slate-700 backdrop-blur-sm">
                  <Presentation size={15} className="text-sky-600" /> AI PowerPoint Studio
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 border border-indigo-200/80 shadow-xs text-xs font-semibold text-slate-700 backdrop-blur-sm">
                  <FileText size={15} className="text-indigo-600" /> Handwritten Summaries
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 border border-amber-200/80 shadow-xs text-xs font-semibold text-slate-700 backdrop-blur-sm">
                  <BookOpen size={15} className="text-amber-600" /> Interactive Flashcards
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 border border-violet-200/80 shadow-xs text-xs font-semibold text-slate-700 backdrop-blur-sm">
                  <FileVideo size={15} className="text-violet-600" /> Smart Video Theatre
                </div>
              </div>


            </div>)}



          {slides.length > 0 && (
            <div className="bg-white rounded-[24px] shadow-[0_4px_25px_rgba(15,23,42,0.06)] overflow-hidden relative border border-slate-200/80">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-rose-600 to-pink-600"></div>
              <div className="border-b border-[#E0E0D5] p-6 flex items-center justify-between">
                <h3 className="font-serif text-2xl text-[#3A3A2F]">
                  Presentation Generated
                </h3>
                <div className="flex gap-2">
                  <select 
                    value={pptTheme}
                    onChange={(e) => setPptTheme(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="academic">Academic Theme</option>
                    <option value="professional">Professional Theme</option>
                    <option value="minimalist">Minimalist Theme</option>
                  </select>
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pink-200 transition-colors"
                  >
                    <Presentation size={16} /> Preview Slides
                  </button>
                  <button 
                    onClick={downloadPPT}
                    className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-colors"
                  >
                    <Download size={16} /> Download PPTX
                  </button>
                  <button 
                    onClick={() => {
                      setSlides([]);
                      setResultType("");
                    }} 
                    className="text-[#8A8A7A] hover:bg-[#F5F5F0] p-2 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6">Generated {slides.length} slides successfully. Click the download button above to get your presentation.</p>
                
                <div className="space-y-6">
                  {slides.slice(0, 5).map((slide, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                      <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Slide {idx + 1} • {slide.slideType}</div>
                      <h4 className="font-bold text-lg text-slate-800 mb-3">{slide.title}</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {slide.bullets?.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {slides.length > 5 && (
                    <div className="text-center text-slate-500 italic p-4 border border-dashed border-slate-300 rounded-xl">
                      ...and {slides.length - 5} more slides. Download the PPTX to see them all.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {resultText && (
            <div className="bg-white rounded-[24px] shadow-[0_4px_25px_rgba(15,23,42,0.06)] overflow-hidden relative border border-slate-200/80">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600"></div>
              <div className="border-b border-[#E0E0D5] p-6 flex items-center justify-between">
                <h3 className="font-serif text-2xl text-[#3A3A2F]">
                  {resultType === "lesson-plan" ? "Study Lesson Planner" : resultType === "question-bank" ? "Study Question Bank" : resultType === "assessment" ? "Assessment Paper" : "Chapter-wise Summary"}
                </h3>
                {resultType !== "lesson-plan" && (
                  <div className="flex flex-wrap items-center gap-2">
{ (
                      <>
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
                      </>)}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isExporting}
                        className="border border-[#5A5A40] bg-[#5A5A40] text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                        {isExporting ? 'Exporting...' : 'Export'}
                        <ChevronDown size={14} />
                      </button>
                      {showExportMenu && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 overflow-hidden ${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-white border-slate-200"}`}>
                          <button onClick={() => { setShowExportMenu(false); downloadHandwrittenPDF(false); }} className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${isDarkMode ? "hover:bg-[#383832] text-[#E0E0D5]" : "hover:bg-slate-50 text-slate-700"} flex items-center gap-2`}>
                            <FileText size={14} /> High-Quality PDF
                          </button>
                          <button onClick={() => { setShowExportMenu(false); downloadHandwrittenPDF(true); }} className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${isDarkMode ? "hover:bg-[#383832] text-[#E0E0D5]" : "hover:bg-slate-50 text-slate-700"} flex items-center gap-2`}>
                            <FileText size={14} /> Fast Export PDF
                          </button>
                          <button onClick={downloadDoc} className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider border-t transition-colors ${isDarkMode ? "border-[#383832] hover:bg-[#383832] text-[#E0E0D5]" : "border-slate-100 hover:bg-slate-50 text-slate-700"} flex items-center gap-2`}>
                            <FileText size={14} /> Word (DOC)
                          </button>
                          <button onClick={downloadMarkdown} className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider border-t transition-colors ${isDarkMode ? "border-[#383832] hover:bg-[#383832] text-[#E0E0D5]" : "border-slate-100 hover:bg-slate-50 text-slate-700"} flex items-center gap-2`}>
                            <FileText size={14} /> Markdown
                          </button>
                        </div>)}
                    </div>
                  </div>)}

              </div>
              
              <div className="p-8">
                {resultType === "lesson-plan" && lessonPlan && (
                  <div className="mb-8 bg-[#FAF9F6] border border-[#E0E0D5] rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-white border border-[#E0E0D5] rounded-xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-[#FEF3C7] text-[#D97706] rounded-xl">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider">Completion Duration</p>
                          <p className="text-sm font-semibold text-[#3A3A2F] mt-0.5">{lessonPlan.duration || "N/A"}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-[#E0E0D5] rounded-xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-[#E0F2FE] text-[#0369A1] rounded-xl">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider">Total Lessons/Sessions</p>
                          <p className="text-sm font-semibold text-[#3A3A2F] mt-0.5">{lessonPlan.totalSessions || `${lessonPlan.sessions?.length || 0} Sessions`}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-[#E0E0D5] rounded-xl p-4 flex flex-col justify-center shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider">Syllabus Progress</p>
                          <span className="text-xs font-bold text-[#5A5A40]">
                            {Math.round((Object.values(completedSessions).filter(Boolean).length / (lessonPlan.sessions?.length || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E0E0D5] h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#5A5A40] h-full transition-all duration-300"
                            style={{ width: `${(Object.values(completedSessions).filter(Boolean).length / (lessonPlan.sessions?.length || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-[#8A8A7A] mt-1.5 text-right font-medium">
                          {Object.values(completedSessions).filter(Boolean).length} of {lessonPlan.sessions?.length || 0} completed
                        </p>
                      </div>
                    </div>

                    <h4 className="font-serif text-lg text-[#3A3A2F] mb-4 flex items-center gap-2">
                      <Calendar size={18} className="text-[#5A5A40]" /> Interactive Lesson Timeline
                    </h4>
                    
                    <div className="space-y-4">
                      {lessonPlan.sessions?.map((session, sIdx) => {
                        const isCompleted = !!completedSessions[sIdx];
                        return (
                          <div 
                            key={sIdx} 
                            onClick={() => setCompletedSessions(prev => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                            className={`border rounded-xl p-4 transition-all cursor-pointer flex gap-4 text-left ${isCompleted ? 'bg-[#F0F0E8] border-[#8A8A7A] opacity-85 shadow-none' : 'bg-white border-[#E0E0D5] hover:border-[#8A8A7A] hover:shadow-sm'}`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isCompleted ?? false} 
                              onChange={() => {}} // toggled on container click
                              className="mt-1 h-4 w-4 rounded text-[#5A5A40] focus:ring-[#5A5A40] border-gray-300 cursor-pointer shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <h5 className={`font-semibold text-sm ${isCompleted ? 'line-through text-[#8A8A7A]' : 'text-[#3A3A2F]'}`}>
                                  {session.name}
                                </h5>
                                <span className="text-xs font-medium px-2 py-0.5 bg-[#FAF9F6] border border-[#E0E0D5] rounded-full text-[#5A5A40]">
                                  {session.duration}
                                </span>
                              </div>
                              <p className={`text-xs mt-1.5 leading-relaxed ${isCompleted ? 'text-[#8A8A7A]' : 'text-[#6A6A5A]'}`}>
                                {session.description}
                              </p>
                              
                              {session.objectives && session.objectives.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A] mb-1">Learning Objectives</p>
                                  <ul className="list-disc pl-4 text-xs space-y-1 text-[#3A3A2F]">
                                    {session.objectives.map((obj, oIdx) => (
                                      <li key={oIdx} className={isCompleted ? 'text-[#8A8A7A] line-through' : ''}>{obj}</li>))}
                                  </ul>
                                </div>)}

                              {session.activities && session.activities.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A] mb-1">Session Activities</p>
                                  <ul className="list-decimal pl-4 text-xs space-y-1 text-[#3A3A2F]">
                                    {session.activities.map((act, aIdx) => (
                                      <li key={aIdx} className={isCompleted ? 'text-[#8A8A7A] line-through' : ''}>{act}</li>))}
                                  </ul>
                                </div>)}
                            </div>
                          </div>);
                      })}
                    </div>
                  </div>)}

                {/* 
                  Applying a handwriting font class when in student mode.
                */}
                <div 
                  ref={notesRef}
                  className={`prose max-w-none page-break-before exam-paper-table mx-auto bg-white shadow-xl ${(mode === 'student') && true ? `${handwritingFont} text-xl p-10 pb-16 rounded-sm relative` : 'font-sans text-[#4A4A3F] p-10 relative'}`}
                  style={Object.assign({
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box'
                  }, (mode === 'student') && true ? {
                    backgroundImage: pageStyle === 'ruled' 
                      ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)' 
                      : pageStyle === 'box' 
                        ? 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)' 
                        : 'none',
                    backgroundAttachment: 'local',
                    lineHeight: '32px',
                    '--tw-prose-body': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-headings': '#3A3A2F',
                    '--tw-prose-bold': '#3A3A2F',
                    '--tw-prose-th-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.3)' : 'rgba(58, 58, 47, 0.3)',
                    '--tw-prose-td-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.2)' : 'rgba(58, 58, 47, 0.2)',
                    color: penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                  } as React.CSSProperties : {})}
                >
                  {(mode === 'student') && true && (
                    <>
                      {pageStyle !== 'box' && <div className="absolute left-10 top-0 bottom-0 w-px bg-[#fee2e2]"></div>}
                      <div className="absolute bottom-8 right-10 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#bfdbfe]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#dbeafe]"></div>
                      </div>
                    </>)}
                  {(mode === 'student') && true && (
                    <div className="pl-8">
                      { resultText.split('---SET_SEPARATOR---').map((setMarkdown, index) => (
                        <div key={`set-${index}`} className="mb-10">
                          {setMarkdown.split(/[\s\-_*"'`]*PAGE_BREAK[\s\-_*"'`]*/i).map((pageMarkdown, pageIndex, pageArr) => (
                            <div key={`page-${pageIndex}`} className="relative">

                              <div className="markdown-content">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4 w-full"><table className={`w-full border-collapse ${mode === 'student' ? `border-2 border-opacity-20 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} /></div>,
                              th: ({node, ...props}) => <th className={`p-2 text-left ${mode === 'student' ? `border-b-2 border-opacity-20 bg-transparent font-bold text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,
                              td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,
                              li: ({node, ...props}) => <li className={`mb-2 ${mode === 'student' ? `text-inherit ${handwritingFont}` : ''}`} {...props} />,
                              h1: ({ children }) => <h1 className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h1>,
                              h2: ({ children }) => <h2 className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h2>,
                              h3: ({ children }) => <h3 className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h3>,
                              h4: ({ children }) => <h4 className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h4>,
                              h5: ({ children }) => <h5 className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h5>,
                              h6: ({ children }) => <h6 className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h6>,
                              strong: ({ children }) => <strong className={`font-bold ${mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</strong>,
                              em: ({ children }) => <em className={mode === 'student' ? '!text-[#3A3A2F]' : 'text-inherit'}>{children}</em>,
                              pre({ node, children, ...props }: any) {
                                return <pre {...props} className={`${props.className || ''} ${(mode === 'student') ? 'bg-[#F9F9F7] border border-[#E0E0D5] rounded p-4' : 'bg-gray-100 p-2'}`}>{children}</pre>;
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
                                  <code className={`${className} ${(mode === 'student') && !inline ? `${handwritingFont} text-lg` : ''}`} {...props}>
                                    {children}
                                  </code>);
                              },
                              p: ({node, children, ...props}: any) => {
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
                                    </div>);
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
                                    </p>);
                                }

                                if (typeof children === 'string' && children.includes('?')) {
                                  return <p className="font-bold text-black">{children}</p>;
                                }

                                return <p {...props}>{children}</p>;
                              }

                            }
}
                          >
                            {pageMarkdown}
                          </ReactMarkdown>
                        </div>
                      </div>))}
                        </div>))}
                    </div>)}

                </div>
              </div>
            </div>)}
          {flashcards.length > 0 && (() => {
                let cardThemes = [];
                if (flashcardThemeStyle === "monochrome") {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-neutral-800 to-neutral-950 border-neutral-700",
                      back: "bg-gradient-to-bl from-neutral-700 to-neutral-900 border-neutral-600",
                      tag: "text-neutral-200 bg-white/10 border-white/20 backdrop-blur-sm",
                      accent: "from-white/5",
                      text: "text-neutral-50",
                      textSecondary: "text-neutral-400",
                      divider: "bg-neutral-600"
                    }

                  ];
                }
 else if (flashcardThemeStyle === "pastel") {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-rose-100 to-pink-50 border-rose-200",
                      back: "bg-gradient-to-bl from-pink-50 to-rose-100 border-pink-200",
                      tag: "text-rose-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-rose-900",
                      textSecondary: "text-rose-600",
                      divider: "bg-rose-300"
                    },
                    {
                      front: "bg-gradient-to-br from-sky-100 to-blue-50 border-sky-200",
                      back: "bg-gradient-to-bl from-blue-50 to-sky-100 border-blue-200",
                      tag: "text-sky-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-sky-900",
                      textSecondary: "text-sky-600",
                      divider: "bg-sky-300"
                    },
                    {
                      front: "bg-gradient-to-br from-emerald-100 to-green-50 border-emerald-200",
                      back: "bg-gradient-to-bl from-green-50 to-emerald-100 border-green-200",
                      tag: "text-emerald-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-emerald-900",
                      textSecondary: "text-emerald-600",
                      divider: "bg-emerald-300"
                    },
                    {
                      front: "bg-gradient-to-br from-amber-100 to-yellow-50 border-amber-200",
                      back: "bg-gradient-to-bl from-yellow-50 to-amber-100 border-yellow-200",
                      tag: "text-amber-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-amber-900",
                      textSecondary: "text-amber-600",
                      divider: "bg-amber-300"
                    }

                  ];
                }
 else if (flashcardThemeStyle === "high-contrast") {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-yellow-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-yellow-500",
                      tag: "text-[#000000] bg-yellow-400 border-yellow-300 backdrop-blur-sm",
                      accent: "from-yellow-400/20",
                      text: "text-yellow-400",
                      textSecondary: "text-yellow-200",
                      divider: "bg-yellow-400"
                    },
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-cyan-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-cyan-500",
                      tag: "text-[#000000] bg-cyan-400 border-cyan-300 backdrop-blur-sm",
                      accent: "from-cyan-400/20",
                      text: "text-cyan-400",
                      textSecondary: "text-cyan-200",
                      divider: "bg-cyan-400"
                    },
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-fuchsia-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-fuchsia-500",
                      tag: "text-[#000000] bg-fuchsia-400 border-fuchsia-300 backdrop-blur-sm",
                      accent: "from-fuchsia-400/20",
                      text: "text-fuchsia-400",
                      textSecondary: "text-fuchsia-200",
                      divider: "bg-fuchsia-400"
                    },
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-green-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-green-500",
                      tag: "text-[#000000] bg-green-400 border-green-300 backdrop-blur-sm",
                      accent: "from-green-400/20",
                      text: "text-green-400",
                      textSecondary: "text-green-200",
                      divider: "bg-green-400"
                    }

                  ];
                }
 else {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-[#5A5A40] to-[#42422F] border-[#6A6A4D]",
                      back: "bg-gradient-to-bl from-[#4A4A35] to-[#363627] border-[#5A5A40]",
                      tag: "text-[#F5F5F0] bg-white/10 border-white/20 backdrop-blur-sm",
                      accent: "from-white/10",
                      text: "text-[#F5F5F0]",
                      textSecondary: "text-[#E0E0D5]",
                      divider: "bg-white/20"
                    },
                    {
                      front: "bg-gradient-to-br from-[#8C4A42] to-[#6A3630] border-[#A35950]",
                      back: "bg-gradient-to-bl from-[#7A403A] to-[#5C2E29] border-[#8C4A42]",
                      tag: "text-[#FDF3F2] bg-white/10 border-white/20 backdrop-blur-sm",
                      accent: "from-white/10",
                      text: "text-[#FDF3F2]",
                      textSecondary: "text-[#EBD6D3]",
                      divider: "bg-white/20"
                    },
                    {
                      front: "bg-gradient-to-br from-[#967035] to-[#755524] border-[#B08544]",
                      back: "bg-gradient-to-bl from-[#85622C] to-[#66491D] border-[#967035]",
                      tag: "text-[#FDF8F0] bg-white/10 border-white/20 backdrop-blur-sm",
                      accent: "from-white/10",
                      text: "text-[#FDF8F0]",
                      textSecondary: "text-[#EBE0C8]",
                      divider: "bg-white/20"
                    },
                    {
                      front: "bg-gradient-to-br from-[#3D5266] to-[#2B3C4D] border-[#4F677D]",
                      back: "bg-gradient-to-bl from-[#34485C] to-[#243342] border-[#3D5266]",
                      tag: "text-[#F0F2F5] bg-white/10 border-white/20 backdrop-blur-sm",
                      accent: "from-white/10",
                      text: "text-[#F0F2F5]",
                      textSecondary: "text-[#D1D6DF]",
                      divider: "bg-white/20"
                    }

                  ];
                }

                const theme = cardThemes[currentCardIndex % cardThemes.length];

                return (
                  <div className="space-y-6">
                    <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.05)] border transition-colors ${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-[#E0E0D5]"}`}>
                      <div>
                        <h3 className={`font-serif text-2xl ${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}`}>Concept Flashcards</h3>
                        <p className={`text-sm mt-1 ${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}`}>Review key terminology and concepts</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-xs font-semibold py-2 px-4 rounded-full ${isDarkMode ? "bg-[#282824] text-[#C2C2B0]" : "bg-[#F0F0E8] text-[#5A5A40]"}`}>
                          Progress: {currentCardIndex + 1} / {flashcards.length}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-[#383832]" : "bg-[#E0E0D5]"}`}>
                      <div 
                        className="bg-[#5A5A40] h-full transition-all duration-300"
                        style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                      />
                    </div>

                    {/* Interactive Flashcard with Flip Animation */}
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="group cursor-pointer perspective-1000 w-full max-w-2xl mx-auto h-96 relative focus:outline-none"
                    >
                      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                        
                        {/* Front Side */}
                        <div className={`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-12 flex flex-col items-center justify-center text-center transition-all ${theme.front} ${isDarkMode ? "shadow-black/40" : "shadow-[0_12px_40px_rgba(90,90,64,0.15)]"}`}>
                          <div className="absolute inset-0 rounded-[24px] border border-white/20 pointer-events-none mix-blend-overlay"></div>
                          <div className={`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm ${theme.tag}`}>
                            Term / Concept
                          </div>
                          
                          {/* Decorative element */}
                          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.accent} to-transparent rounded-tr-[24px] pointer-events-none`}></div>

                          <span className={`text-3xl md:text-5xl font-serif font-bold leading-tight px-4 select-none drop-shadow-md ${theme.text}`}>
                            {flashcards[currentCardIndex].term}
                          </span>
                          <div className="absolute bottom-8 flex flex-col items-center">
                            <div className={`w-8 h-1 rounded-full mb-3 ${theme.divider}`}></div>
                            <span className={`text-xs font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity ${theme.textSecondary}`}>
                              Click card to reveal definition
                            </span>
                          </div>
                        </div>

                        {/* Back Side */}
                        <div className={`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-10 flex flex-col items-center justify-center text-center rotate-y-180 transition-all ${theme.back} ${isDarkMode ? "shadow-black/40" : "shadow-[0_12px_40px_rgba(90,90,64,0.15)]"}`}>
                          <div className="absolute inset-0 rounded-[24px] border border-white/20 pointer-events-none mix-blend-overlay"></div>
                          <div className={`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm ${theme.tag}`}>
                            Definition / Explanation
                          </div>

                          {/* Decorative element */}
                          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.accent} to-transparent rounded-tr-[24px] pointer-events-none`}></div>

                          <div className="flex-1 flex items-center justify-center w-full overflow-y-auto no-scrollbar py-6">
                            <p className={`text-lg md:text-xl font-medium leading-relaxed max-w-xl px-4 select-none ${theme.text}`}>
                              {flashcards[currentCardIndex].definition}
                            </p>
                          </div>
                          
                          <div className="absolute bottom-8 flex flex-col items-center">
                            <div className={`w-8 h-1 rounded-full mb-3 ${theme.divider}`}></div>
                            <span className={`text-xs font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity ${theme.textSecondary}`}>
                              Click card to show term
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between max-w-2xl mx-auto pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                          setTimeout(() => {
                            setCurrentCardIndex(prev => Math.max(0, prev - 1));
                          }, isFlipped ? 150 : 0);
                        }
}
                        disabled={currentCardIndex === 0}
                        className="px-6 py-2.5 rounded-full border border-[#D1D1C4] text-[#5A5A40] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        &larr; Previous
                      </button>
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-xs text-[#8A8A7A] font-bold uppercase tracking-[0.1em] select-none">
                          Card {currentCardIndex + 1} of {flashcards.length}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFlipped(false);
                              setTimeout(() => {
                                setFlashcards(prev => {
                                  const shuffled = [...prev];
                                  for (let i = shuffled.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                                  }

                                  return shuffled;
                                });
                                setCurrentCardIndex(0);
                              }, isFlipped ? 150 : 0);
                            }
}
                            className="text-xs font-semibold text-[#5A5A40] flex items-center gap-1.5 hover:text-[#3A3A2F] hover:bg-[#F0F0E8] px-3 py-1.5 rounded-full transition-colors"
                            title="Shuffle cards"
                          >
                            <Shuffle size={14} />
                            <span>Shuffle</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadCSV();
                            }
}
                            className="text-xs font-semibold text-[#5A5A40] flex items-center gap-1.5 hover:text-[#3A3A2F] hover:bg-[#F0F0E8] px-3 py-1.5 rounded-full transition-colors"
                            title="Download as CSV for Anki/Quizlet"
                          >
                            <Download size={14} />
                            <span>CSV</span>
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                          setTimeout(() => {
                            setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                          }, isFlipped ? 150 : 0);
                        }
}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="px-6 py-2.5 rounded-full bg-[#5A5A40] text-white hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>);
              })()}
          {resultType === "video" && videoData && (
            <VideoExplainer 
              videoData={videoData} 
              onClose={() => {
                setVideoData(null);
                setResultType("");
              }
}
            />)}
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
                    onClick={confirmScan}
                    className="px-6 py-2.5 rounded-full bg-[#5A5A40] text-white hover:bg-opacity-90 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
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
      </div>
      </div>
    
      {showPreviewModal && (
        <SlidePreviewModal 
          slides={slides} 
          theme={pptTheme}
          onClose={() => setShowPreviewModal(false)} 
        />
      )}
</div>
  );
}
