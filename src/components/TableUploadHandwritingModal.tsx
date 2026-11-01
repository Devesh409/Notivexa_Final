import React, { useState } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  ClipboardPaste,
  Table as TableIcon,
  CheckCircle2,
} from "lucide-react";

export interface StructuredTablePayload {
  title: string;
  headers: string[];
  rows: string[][];
}

interface TableUploadHandwritingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateFromTableGrid: (payload: StructuredTablePayload) => Promise<void>;
  onUploadTableFile: (file: File) => Promise<void>;
  onConvertCurrentDocToTable?: () => Promise<void>;
  hasActiveDocument?: boolean;
  activeDocumentName?: string;
  isGenerating?: boolean;
  isDarkMode?: boolean;
}

const SAMPLE_TABLES: Array<{
  id: string;
  label: string;
  title: string;
  headers: string[];
  rows: string[][];
}> = [
  {
    id: "sorting-complexity",
    label: "Sorting Algorithms Complexity Table",
    title: "Comparison of Sorting Algorithms (Time & Space Complexity)",
    headers: ["Sr. No.", "Algorithm Name", "Best Case", "Average Case", "Worst Case", "Space Complexity", "Stable?"],
    rows: [
      ["1", "Bubble Sort", "O(n)", "O(n²)", "O(n²)", "O(1)", "Yes"],
      ["2", "Selection Sort", "O(n²)", "O(n²)", "O(n²)", "O(1)", "No"],
      ["3", "Insertion Sort", "O(n)", "O(n²)", "O(n²)", "O(1)", "Yes"],
      ["4", "Merge Sort", "O(n log n)", "O(n log n)", "O(n log n)", "O(n)", "Yes"],
      ["5", "Quick Sort", "O(n log n)", "O(n log n)", "O(n²)", "O(log n)", "No"],
      ["6", "Heap Sort", "O(n log n)", "O(n log n)", "O(n log n)", "O(1)", "No"],
      ["7", "Counting Sort", "O(n + k)", "O(n + k)", "O(n + k)", "O(k)", "Yes"],
      ["8", "Radix Sort", "O(nk)", "O(nk)", "O(nk)", "O(n + k)", "Yes"],
    ],
  },
  {
    id: "osi-layers",
    label: "OSI 7-Layer Reference Model Table",
    title: "ISO-OSI 7-Layer Network Architecture & Protocols Table",
    headers: ["Layer No.", "Layer Name", "Data Unit (PDU)", "Core Protocols", "Primary Function & Hardware Device"],
    rows: [
      ["Layer 7", "Application Layer", "Data / Message", "HTTP, HTTPS, FTP, SMTP, DNS", "User application network services & API interface"],
      ["Layer 6", "Presentation Layer", "Data", "SSL/TLS, JPEG, ASCII, MPEG", "Data encryption, compression & format translation"],
      ["Layer 5", "Session Layer", "Data", "NetBIOS, RPC, PPTP, SAP", "Session establishment, checkpointing & dialog control"],
      ["Layer 4", "Transport Layer", "Segment / Datagram", "TCP, UDP, SCTP", "End-to-end flow control, port addressing & error recovery"],
      ["Layer 3", "Network Layer", "Packet", "IPv4, IPv6, ICMP, OSPF, BGP", "Logical IP addressing & optimal packet routing (Router)"],
      ["Layer 2", "Data Link Layer", "Frame", "Ethernet (802.3), Wi-Fi, PPP, ARP", "MAC physical addressing & framing error detection (Switch)"],
      ["Layer 1", "Physical Layer", "Raw Bits (0 & 1)", "RS-232, DSL, 100Base-T, Fiber", "Bit stream transmission over physical medium (Hub / Repeater)"],
    ],
  },
  {
    id: "dbms-normalization",
    label: "DBMS Normalization Forms Table",
    title: "Database Normalization Forms (1NF to BCNF) Comparison Table",
    headers: ["Normal Form", "Mandatory Condition / Rule", "Eliminates Anomaly Type", "Design Transformation Action"],
    rows: [
      ["1NF (First)", "All attributes must contain only atomic (indivisible) values", "Repeating groups & multi-valued attributes", "Split multi-valued columns into separate atomic rows"],
      ["2NF (Second)", "In 1NF + No partial dependency on composite primary key", "Partial functional dependency redundancy", "Decompose non-key attributes dependent on part of PK"],
      ["3NF (Third)", "In 2NF + No transitive dependency (X -> Y -> Z)", "Transitive dependency update/delete anomalies", "Move transitively dependent attributes to a new relation"],
      ["BCNF (Boyce-Codd)", "In 3NF + For every dependency X -> Y, X is a Super Key", "Overlapping candidate key anomalies", "Decompose relation so every determinant is a candidate key"],
      ["4NF (Fourth)", "In BCNF + No non-trivial multi-valued dependencies", "Independent multi-valued fact redundancy", "Separate independent 1:N relationships into distinct tables"],
    ],
  },
  {
    id: "project-logbook",
    label: "Project Weekly Progress Logbook Table",
    title: "Project Weekly Progress & Review Logbook",
    headers: ["Date", "Week", "Contents", "Remark"],
    rows: [
      ["03/07/26", "1", "Discussion on project domain and identification of research areas.", "Discussed AI-based education, personalized learning and Generative AI applications."],
      ["07/07/26", "2", "Selection of potential research topics.", "Different AI-based learning system topics were reviewed and shortlisted."],
      ["10/07/26", "3", "Finalization of project topic and initial literature review.", "Project topic approved and research direction discussed."],
      ["14/07/26", "4", "Identification of problem statement, objectives and project scope.", "Suggestions regarding project objectives and scope."],
      ["17/07/26", "5", "Study of existing research papers related to AI-based personalized learning systems.", "Suggested reviewing additional research papers."],
      ["21/07/26", "6", "Preparation and submission of project abstract.", "Abstract corrections and improvements suggested."],
      ["24/07/26", "7", "Discussion on research gaps, uniqueness and proposed methodology.", "Suggested clearly defining the research contribution."],
      ["28/07/26", "8", "Study of Generative AI, NLP and document processing techniques.", "Technical concepts and AI algorithms discussed."],
    ],
  },
];

function normalizeRowCells(cells: string[], maxCols: number, isDataRow: boolean): string[] {
  const slice = cells.slice(0, maxCols);
  while (slice.length < maxCols) slice.push("");
  if (isDataRow && slice.length >= 2 && slice[0] && !slice[1]) {
    const mergedDateNum = slice[0].match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(\d{1,3})$/);
    if (mergedDateNum) {
      slice[0] = mergedDateNum[1];
      slice[1] = mergedDateNum[2];
    }
  }
  return slice;
}

function parseTextIntoTableGrid(rawText: string): { title?: string; headers: string[]; rows: string[][] } | null {
  const clean = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!clean) return null;

  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let detectedHeading = "";
  if (lines[0] && !lines[0].startsWith("|") && !lines[0].includes("\t") && !lines[0].includes(",")) {
    detectedHeading = lines[0].replace(/^#{1,6}\s+/, "").trim();
  }

  // 1. Check if Markdown Pipe Table (| Col 1 | Col 2 |)
  const pipeLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (pipeLines.length >= 2) {
    const parsedRows: string[][] = [];
    for (const pl of pipeLines) {
      if (/^\|[\s\-:|]+\|$/.test(pl)) continue; // skip separator
      const cells = pl
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.some((c) => c.length > 0)) {
        parsedRows.push(cells);
      }
    }
    if (parsedRows.length >= 1) {
      const colCount = Math.min(10, Math.max(...parsedRows.map((r) => r.length), 2));
      const normalized = parsedRows.map((r, idx) => normalizeRowCells(r, colCount, idx > 0));
      const hdrs = normalized[0];
      const autoTitle =
        detectedHeading ||
        (hdrs.filter(Boolean).length >= 2 ? `${hdrs.filter(Boolean).slice(0, 4).join(" • ")} Table` : undefined);
      return {
        title: autoTitle,
        headers: hdrs,
        rows: normalized.length > 1 ? normalized.slice(1) : [hdrs.map(() => "")],
      };
    }
  }

  // 2. Check if Tab-Separated (Excel / Google Sheets / Word Table copy-paste)
  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ",";
  const parsed: string[][] = [];
  for (const line of lines) {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    if (cells.some((c) => c.length > 0)) {
      parsed.push(cells);
    }
  }

  if (parsed.length === 0) return null;
  const maxCols = Math.min(10, Math.max(...parsed.map((r) => r.length), 2));
  const normalized = parsed.map((r, idx) => normalizeRowCells(r, maxCols, idx > 0));
  const hdrs = normalized[0];
  const autoTitle =
    detectedHeading ||
    (hdrs.filter(Boolean).length >= 2 ? `${hdrs.filter(Boolean).slice(0, 4).join(" • ")} Table` : undefined);

  return {
    title: autoTitle,
    headers: hdrs,
    rows: normalized.length > 1 ? normalized.slice(1) : [Array.from({ length: maxCols }, () => "")],
  };
}

export const TableUploadHandwritingModal: React.FC<TableUploadHandwritingModalProps> = ({
  isOpen,
  onClose,
  onGenerateFromTableGrid,
  onUploadTableFile,
  onConvertCurrentDocToTable,
  hasActiveDocument = false,
  activeDocumentName = "",
  isGenerating = false,
  isDarkMode = false,
}) => {
  const [tableTitle, setTableTitle] = useState<string>(SAMPLE_TABLES[0].title);
  const [headers, setHeaders] = useState<string[]>(SAMPLE_TABLES[0].headers);
  const [rows, setRows] = useState<string[][]>(SAMPLE_TABLES[0].rows);
  const [pasteBoxText, setPasteBoxText] = useState<string>("");
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  if (!isOpen) return null;

  const handleHeaderChange = (colIdx: number, value: string) => {
    setHeaders((prev) => prev.map((h, i) => (i === colIdx ? value : h)));
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    setRows((prev) =>
      prev.map((row, rIdx) =>
        rIdx === rowIdx ? row.map((cell, cIdx) => (cIdx === colIdx ? value : cell)) : row
      )
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, Array.from({ length: headers.length }, () => "")]);
  };

  const handleRemoveRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== rowIdx));
  };

  const handleAddColumn = () => {
    if (headers.length >= 10) return;
    setHeaders((prev) => [...prev, `Column ${prev.length + 1}`]);
    setRows((prev) => prev.map((r) => [...r, ""]));
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (headers.length <= 2) return;
    setHeaders((prev) => prev.filter((_, idx) => idx !== colIdx));
    setRows((prev) => prev.map((r) => r.filter((_, idx) => idx !== colIdx)));
  };

  const handleApplyPastedTable = () => {
    const parsed = parseTextIntoTableGrid(pasteBoxText);
    if (parsed) {
      if (parsed.title) {
        setTableTitle(parsed.title);
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setShowPasteBox(false);
      setPasteBoxText("");
    }
  };

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!selectedFile) return;

    setUploadedFileName(selectedFile.name);
    const lower = selectedFile.name.toLowerCase();

    // If CSV / TSV / TXT / MD / JSON, also preview it right inside the interactive table grid!
    if (/\.(csv|tsv|txt|md|markdown)$/i.test(lower)) {
      try {
        const text = await selectedFile.text();
        const parsed = parseTextIntoTableGrid(text);
        if (parsed) {
          setTableTitle(selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " "));
          setHeaders(parsed.headers);
          setRows(parsed.rows);
          return;
        }
      } catch {
        // Fallback to direct server upload
      }
    }

    // For .xlsx, .xls, .docx, .pdf, or images of tables, upload and convert directly on the server
    await onUploadTableFile(selectedFile);
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-5xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDarkMode
            ? "border-[#383832] bg-[#1E1E1B] text-[#F5F5F0]"
            : "border-slate-200 bg-white text-slate-800"
        }`}
      >
        {/* Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isDarkMode ? "border-[#383832] bg-[#242420]" : "border-slate-200/80 bg-slate-50/70"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
              <TableIcon size={21} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg sm:text-xl font-bold truncate">
                  Upload Table & Interactive Table-Form Handwriting Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white">
                  1:1 Table Form → Student Handwriting
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                Upload any table file (`.XLSX`, `.CSV`, `.TSV`, `.DOCX`, `.PDF`, Image) or enter/paste rows & columns in table form to generate realistic student handwritten A4 table pages.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-[#383832] text-[#A1A194]" : "hover:bg-slate-200/70 text-slate-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Top Action Strip: Upload Table File OR Convert Active Document OR Paste Excel/CSV */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Upload Table File */}
            <label
              className={`p-4 rounded-2xl border-2 border-dashed flex items-center gap-3.5 cursor-pointer transition-all ${
                isDarkMode
                  ? "border-blue-500/40 bg-blue-950/20 hover:bg-blue-950/35 hover:border-blue-400"
                  : "border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Upload size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold block text-blue-700 dark:text-blue-300">
                  Upload Table File Directly
                </span>
                <span className={`text-[11px] block truncate ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                  {uploadedFileName || ".XLSX, .CSV, .TSV, .DOCX, .PDF or Table Image"}
                </span>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.docx,.doc,.pdf,.json,.html,.htm,.txt,.md,image/*"
                className="hidden"
                onChange={handleFileSelection}
              />
            </label>

            {/* 2. Paste from Excel / Google Sheets / Word Table */}
            <button
              type="button"
              onClick={() => setShowPasteBox((prev) => !prev)}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 cursor-pointer transition-all ${
                showPasteBox
                  ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40"
                  : isDarkMode
                  ? "border-[#383832] bg-[#262622] hover:border-indigo-500/40"
                  : "border-slate-200 bg-slate-50/70 hover:bg-indigo-50/40 hover:border-indigo-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ClipboardPaste size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold block text-indigo-700 dark:text-indigo-300">
                  Paste Table from Excel / Word / CSV
                </span>
                <span className={`text-[11px] block truncate ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                  Auto-fills rows & columns in table form
                </span>
              </div>
            </button>

            {/* 3. Convert Active Uploaded Document into Table Form */}
            {hasActiveDocument && onConvertCurrentDocToTable ? (
              <button
                type="button"
                disabled={isGenerating}
                onClick={async () => {
                  await onConvertCurrentDocToTable();
                  onClose();
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 cursor-pointer transition-all disabled:opacity-50 ${
                  isDarkMode
                    ? "border-emerald-500/40 bg-emerald-950/25 hover:bg-emerald-950/40"
                    : "border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold block text-emerald-800 dark:text-emerald-300">
                    Convert Active Doc to Table Form
                  </span>
                  <span className={`text-[11px] block truncate ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
                    {activeDocumentName || "Current Uploaded Document"}
                  </span>
                </div>
              </button>
            ) : (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                  isDarkMode ? "border-[#383832] bg-[#242420]" : "border-slate-200/80 bg-slate-50/60"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Auto Multi-Page A4 Table Split
                  </span>
                  <span className={`text-[11px] block ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                    Repeats column headers on every A4 sheet
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Quick Paste Box */}
          {showPasteBox && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDarkMode ? "bg-[#262622] border-indigo-500/40" : "bg-indigo-50/50 border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  Paste Tab-Separated (Excel / Google Sheets / Word Table), CSV, or Markdown Pipe Table (`| Col 1 | Col 2 |`):
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasteBox(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
              <textarea
                rows={4}
                value={pasteBoxText}
                onChange={(e) => setPasteBoxText(e.target.value)}
                placeholder={`Sr. No.\tTopic / Parameter\tFormula / Specification\tRemarks\n1\tOhm's Law\tV = I × R\tLinear resistor relationship\n2\tElectrical Power\tP = V × I = I²R\tMeasured in Watts (W)`}
                className={`w-full p-3 rounded-xl border text-xs font-mono outline-none ${
                  isDarkMode ? "bg-[#1A1A17] border-[#45453B] text-white" : "bg-white border-slate-300 text-slate-800"
                }`}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApplyPastedTable}
                  disabled={!pasteBoxText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Load into Table Form Grid
                </button>
              </div>
            </div>
          )}

          {/* Sample Academic Tables Quick Bar & Title Input */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                Sample Tables:
              </span>
              {SAMPLE_TABLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setTableTitle(sample.title);
                    setHeaders([...sample.headers]);
                    setRows(sample.rows.map((r) => [...r]));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    tableTitle === sample.title
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : isDarkMode
                      ? "bg-[#2A2A26] border-[#45453B] text-sky-300 hover:bg-[#383832]"
                      : "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100"
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus size={13} /> Add Row
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={headers.length >= 10}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Plus size={13} /> Add Column
              </button>
            </div>
          </div>

          {/* Table Title Input */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-700"}`}>
              Handwritten Table Heading / Title (Printed at Top of A4 Notebook Sheet)
            </label>
            <input
              type="text"
              value={tableTitle}
              onChange={(e) => setTableTitle(e.target.value)}
              placeholder="Enter Table Heading (e.g., Comparison of Sorting Algorithms / Experimental Readings Table)"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold outline-none ${
                isDarkMode
                  ? "bg-[#262622] border-[#45453B] text-white focus:border-blue-500"
                  : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600"
              }`}
            />
          </div>

          {/* INTERACTIVE TABLE FORM GRID (Headers + Rows & Columns) */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDarkMode ? "border-[#45453B] bg-[#181815]" : "border-slate-300 bg-[#FCFBF7]"
            }`}
          >
            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr
                    className={
                      isDarkMode
                        ? "bg-[#282B3A] border-b-2 border-blue-500/40"
                        : "bg-rose-50/80 border-b-2 border-slate-700/40"
                    }
                  >
                    <th className="w-10 py-2.5 px-2 text-center text-[11px] font-extrabold text-slate-500 border-r border-slate-300/60">
                      #
                    </th>
                    {headers.map((headerText, colIdx) => (
                      <th
                        key={`header-col-${colIdx}`}
                        className="p-1.5 border-r border-slate-300/60 min-w-[140px]"
                      >
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={headerText}
                            onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                            placeholder={`Column ${colIdx + 1}`}
                            className={`w-full px-2 py-1 rounded-lg text-xs font-extrabold outline-none border ${
                              isDarkMode
                                ? "bg-[#1E1E1B] border-[#45453B] text-sky-300 focus:border-sky-400"
                                : "bg-white border-slate-300 text-slate-900 focus:border-blue-600"
                            }`}
                          />
                          {headers.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(colIdx)}
                              title="Remove this column"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-10 py-2.5 px-2 text-center text-[11px] font-bold text-slate-400">
                      Del
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((rowCells, rowIdx) => (
                    <tr
                      key={`table-row-${rowIdx}`}
                      className={`border-b transition-colors ${
                        isDarkMode
                          ? "border-[#32322C] hover:bg-[#22221E]"
                          : "border-slate-200/90 hover:bg-amber-50/40"
                      }`}
                    >
                      <td className="py-1.5 px-2 text-center text-xs font-bold text-slate-400 border-r border-slate-300/50">
                        {rowIdx + 1}
                      </td>
                      {headers.map((_, colIdx) => (
                        <td
                          key={`cell-${rowIdx}-${colIdx}`}
                          className="p-1.5 border-r border-slate-300/50"
                        >
                          <input
                            type="text"
                            value={rowCells[colIdx] ?? ""}
                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                            placeholder={`Row ${rowIdx + 1}, Col ${colIdx + 1}`}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none border transition-colors ${
                              isDarkMode
                                ? "bg-[#22221F] border-transparent focus:border-blue-500 text-[#E0E0D5]"
                                : "bg-white/90 border-slate-200/80 focus:border-blue-600 text-blue-900 font-medium"
                            }`}
                          />
                        </td>
                      ))}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(rowIdx)}
                          disabled={rows.length <= 1}
                          title="Delete row"
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                isDarkMode ? "border-[#383832] bg-[#22221F] text-[#A1A194]" : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <span>
                <strong>{rows.length}</strong> Rows × <strong>{headers.length}</strong> Columns in Table Form
                {" • "}Automatically paginated across A4 Student Handwriting Sheets (~14 rows per A4 sheet)
              </span>
              <button
                type="button"
                onClick={() => {
                  setRows([Array.from({ length: headers.length }, () => "")]);
                }}
                className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                Clear All Rows
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? "border-[#383832] bg-[#242420]" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-[#A1A194]">
            Renders in your selected Student Handwriting Font & Blue/Black Ink on ruled A4 sheets.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                isDarkMode
                  ? "border-[#45453B] text-[#C2C2B0] hover:bg-[#383832]"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={async () => {
                await onGenerateFromTableGrid({
                  title: tableTitle || "Student Handwritten Table",
                  headers,
                  rows,
                });
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span>✍️ Generate Handwritten Table Pages (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
