import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  HardDrive,
  FileText,
  BookOpen,
  FileQuestion,
  Presentation,
  FileVideo,
  Calendar,
  Layers,
  Download,
  Upload,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  Archive,
  ArrowRight,
} from "lucide-react";
import {
  listStudyItemsFromVault,
  listUploadedDocumentsFromVault,
  deleteStudyItemFromVault,
  deleteUploadedDocumentFromVault,
  getStorageMetrics,
  exportFullUserVaultJSON,
  importFullUserVaultJSON,
  clearAllUserVaultData,
  USER_STORAGE_BASE_USED_BYTES,
  USER_STORAGE_TOTAL_CAPACITY_BYTES,
  type StoredStudyItem,
  type StoredUploadedDocument,
  type StorageCategoryMetrics,
} from "../services/userStorage";
import type { LibraryBook } from "./LibraryPanel";

interface UserStorageVaultPanelProps {
  userKey: string;
  userEmail?: string | null;
  isDarkMode: boolean;
  personalLibraryBooks: LibraryBook[];
  onOpenStudyItem: (item: StoredStudyItem) => void;
  onOpenUploadedDocument: (doc: StoredUploadedDocument) => void;
  onOpenLibraryBook: (book: LibraryBook) => void;
  onSaveCurrentWorkspaceNow: () => Promise<void>;
  onUploadFileToStorage?: (file: File) => Promise<void>;
  onVaultChanged: () => void;
}

type StorageFilterTab =
  | "all"
  | "uploaded-files"
  | "notes"
  | "questions"
  | "flashcards"
  | "ppt-video"
  | "lesson-plans"
  | "library";

export const UserStorageVaultPanel: React.FC<UserStorageVaultPanelProps> = ({
  userKey,
  userEmail,
  isDarkMode,
  personalLibraryBooks,
  onOpenStudyItem,
  onOpenUploadedDocument,
  onOpenLibraryBook,
  onSaveCurrentWorkspaceNow,
  onUploadFileToStorage,
  onVaultChanged,
}) => {
  const [studyItems, setStudyItems] = useState<StoredStudyItem[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<StoredUploadedDocument[]>([]);
  const [metrics, setMetrics] = useState<StorageCategoryMetrics>({
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
  const [activeTab, setActiveTab] = useState<StorageFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const refreshVaultData = async () => {
    setIsLoading(true);
    try {
      const [items, docs, m] = await Promise.all([
        listStudyItemsFromVault(userKey),
        listUploadedDocumentsFromVault(userKey),
        getStorageMetrics(userKey),
      ]);
      setStudyItems(items);
      setUploadedDocs(docs);
      setMetrics(m);
    } catch (err) {
      console.warn("Could not refresh user storage vault:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshVaultData();
  }, [userKey, personalLibraryBooks.length]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatStorageGB = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024 * 1024) {
      return formatBytes(bytes);
    }
    const gb = bytes / (1024 * 1024 * 1024);
    if (Math.abs(gb - Math.round(gb)) < 0.0001) {
      return `${Math.round(gb)} GB`;
    }
    const truncatedTwoDecimals = Math.floor(gb * 100) / 100;
    return `${truncatedTwoDecimals.toFixed(2)} GB`;
  };

  const formatTimestamp = (ms?: number | null) => {
    if (!ms) return "Just now";
    return new Date(ms).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSaveSnapshotClick = async () => {
    setIsSavingSnapshot(true);
    try {
      await onSaveCurrentWorkspaceNow();
      await refreshVaultData();
      onVaultChanged();
      setStatusBanner("Active workspace, uploaded file, and generated outputs saved to your Personal Storage Vault.");
      setTimeout(() => setStatusBanner(null), 4000);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportFullUserVaultJSON(userKey);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `Notivexa_User_Storage_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatusBanner("Complete User Storage backup (.JSON) exported.");
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err: any) {
      setStatusBanner(`Export failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importFullUserVaultJSON(userKey, text);
      await refreshVaultData();
      onVaultChanged();
      setStatusBanner(
        `Restored ${res.importedItemsCount} study outputs and ${res.importedDocsCount} digital documents into your Storage Vault.`
      );
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err: any) {
      setStatusBanner(`Restore failed: ${err?.message || "Invalid backup file"}`);
    }
  };

  const handleDeleteStudyItem = async (id: string) => {
    await deleteStudyItemFromVault(id, userKey);
    await refreshVaultData();
    onVaultChanged();
  };

  const handleDeleteUploadedDoc = async (id: string) => {
    await deleteUploadedDocumentFromVault(id, userKey);
    await refreshVaultData();
    onVaultChanged();
  };

  const handleDirectUploadToStorage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!selectedFile || !onUploadFileToStorage) return;
    setIsSavingSnapshot(true);
    try {
      await onUploadFileToStorage(selectedFile);
      await refreshVaultData();
      onVaultChanged();
      setStatusBanner(`"${selectedFile.name}" uploaded and stored in your 3 GB Personal Storage Vault.`);
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err: any) {
      setStatusBanner(`Upload failed: ${err?.message || "Could not upload file"}`);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleClearVault = async () => {
    await clearAllUserVaultData(userKey);
    setConfirmClearAll(false);
    await refreshVaultData();
    onVaultChanged();
    setStatusBanner("All local vault records have been cleared.");
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const downloadStoredStudyItem = (item: StoredStudyItem) => {
    let content = item.resultText || "";
    let ext = "md";
    let mime = "text/markdown;charset=utf-8";

    if (!content && item.flashcards && item.flashcards.length > 0) {
      content = item.flashcards.map((c, idx) => `${idx + 1}. **${c.term}**: ${c.definition}`).join("\n\n");
    } else if (!content && item.slides && item.slides.length > 0) {
      content = JSON.stringify(item.slides, null, 2);
      ext = "json";
      mime = "application/json;charset=utf-8";
    } else if (!content && item.videoData) {
      content = JSON.stringify(item.videoData, null, 2);
      ext = "json";
      mime = "application/json;charset=utf-8";
    }

    const blob = new Blob([content || JSON.stringify(item, null, 2)], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (item.title || "Saved_Study_Output").replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `${safeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadStoredDocument = (doc: StoredUploadedDocument) => {
    if (doc.blob) {
      const url = URL.createObjectURL(doc.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || "Document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const blob = new Blob([doc.extractedText || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(doc.fileName || "Extracted_Document").replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filteredStudyItems = useMemo(() => {
    return studyItems.filter((item) => {
      if (activeTab === "uploaded-files" || activeTab === "library") return false;
      if (activeTab === "notes") {
        const isNote = [
          "notes",
          "verbatim-handwriting",
          "handwritten-table-form",
          "executive-summary",
          "formula-sheet",
          "glossary",
          "mindmap-atlas",
          "cheat-sheet",
        ].includes(item.type);
        if (!isNote) return false;
      } else if (activeTab === "questions") {
        const isQ = ["question-bank", "short-questions", "assessment", "exam-paper", "viva-qa"].includes(item.type);
        if (!isQ) return false;
      } else if (activeTab === "flashcards") {
        if (item.type !== "flashcards" && (!item.flashcards || item.flashcards.length === 0)) return false;
      } else if (activeTab === "ppt-video") {
        if (item.type !== "ppt" && item.type !== "video" && !item.slides?.length && !item.videoData) return false;
      } else if (activeTab === "lesson-plans") {
        if (item.type !== "lesson-plan" && !item.lessonPlan) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.type?.toLowerCase().includes(q) ||
          item.focusArea?.toLowerCase().includes(q) ||
          item.resultText?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studyItems, activeTab, searchQuery]);

  const filteredUploadedDocs = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "uploaded-files") return [];
    return uploadedDocs.filter((doc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.fileName?.toLowerCase().includes(q) ||
        doc.extractedText?.toLowerCase().includes(q) ||
        doc.uploadSource?.toLowerCase().includes(q)
      );
    });
  }, [uploadedDocs, activeTab, searchQuery]);

  const filteredLibraryBooks = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "library") return [];
    return personalLibraryBooks.filter((bk) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        bk.title?.toLowerCase().includes(q) ||
        bk.author?.toLowerCase().includes(q) ||
        bk.department?.toLowerCase().includes(q)
      );
    });
  }, [personalLibraryBooks, activeTab, searchQuery]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "notes":
        return { label: "Handwritten Notes", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30", icon: BookOpen };
      case "verbatim-handwriting":
      case "handwritten-table-form":
        return { label: "1:1 Same-to-Same Handwriting", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30", icon: FileText };
      case "question-bank":
      case "short-questions":
      case "assessment":
      case "exam-paper":
      case "viva-qa":
        return { label: "Questions & Exam Paper", color: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30", icon: FileQuestion };
      case "flashcards":
        return { label: "Pastel Flashcards", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", icon: Layers };
      case "ppt":
        return { label: "PPT Presentation", color: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30", icon: Presentation };
      case "video":
        return { label: "Smart Video Lecture", color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30", icon: FileVideo };
      case "lesson-plan":
        return { label: "Study Lesson Plan", color: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30", icon: Calendar };
      default:
        return { label: type.replaceAll("-", " "), color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30", icon: Sparkles };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Vault Hero Card */}
      <div
        className={`rounded-3xl border p-5 sm:p-7 shadow-sm transition-all ${
          isDarkMode
            ? "border-[#383832] bg-gradient-to-br from-[#22221F] via-[#262622] to-[#1E1E1B]"
            : "border-sky-200/80 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/40"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600 text-white shadow-md">
              <Database size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`font-serif text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                  Personal User Data Storage Vault
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={12} /> Auto-Save Active
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-700 dark:text-sky-300">
                  <HardDrive size={12} /> {formatBytes(metrics.usedStorageBytes)} Used of {formatStorageGB(metrics.totalCapacityBytes)} Min Storage
                </span>
              </div>
              <p className={`mt-1 text-xs sm:text-sm max-w-2xl leading-relaxed ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
                Dedicated built-in application storage (IndexedDB + Server Vault + Cloud Sync) that automatically stores all your uploaded documents, handwritten notes, question papers, flashcards, PPTs, video lectures, lesson plans, and workspace settings.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-[#A1A194]">
                <span className="flex items-center gap-1">
                  <HardDrive size={12} className="text-sky-600" />
                  Account Vault: <strong className={isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}>{userEmail || "Local Primary User"}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-indigo-500" />
                  Last Saved: <strong className={isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}>{formatTimestamp(metrics.lastSavedAtMs)}</strong>
                </span>
                <span>•</span>
                <span>
                  Storage Capacity: <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(metrics.usedStorageBytes)} Actual Data Used / {formatStorageGB(metrics.totalCapacityBytes)} Minimum Storage</strong> ({formatStorageGB(metrics.availableStorageBytes)} Free • {metrics.totalItems} Records)
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onUploadFileToStorage && (
              <label
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                title="Upload any PDF, Word, PPTX, Excel, or text document directly into your 3 GB User Storage Vault"
              >
                <Upload size={14} />
                <span>Upload File to Storage</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                  className="hidden"
                  onChange={handleDirectUploadToStorage}
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => void handleSaveSnapshotClick()}
              disabled={isSavingSnapshot}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 hover:from-sky-700 hover:to-violet-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingSnapshot ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Save Current Workspace Now</span>
            </button>

            <button
              type="button"
              onClick={() => void handleExportBackup()}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isDarkMode
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
              title="Download a complete .JSON backup of all your stored data"
            >
              <Download size={14} />
              <span>Export Full Backup (.JSON)</span>
            </button>

            <label
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isDarkMode
                  ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-950/50"
                  : "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
              }`}
              title="Restore user data from a previously exported .JSON backup file"
            >
              <Upload size={14} />
              <span>Import / Restore Backup</span>
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportBackup} />
            </label>

            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode
                    ? "border-red-500/30 bg-red-950/20 text-red-300 hover:bg-red-950/40"
                    : "border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100"
                }`}
              >
                <Trash2 size={13} />
                <span>Clear Storage</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-300">Confirm clear?</span>
                <button
                  type="button"
                  onClick={() => void handleClearVault()}
                  className="rounded-lg bg-red-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-red-700 cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="rounded-lg bg-white dark:bg-[#2A2A26] text-slate-700 dark:text-slate-200 px-2 py-1 text-[11px] font-semibold border cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {statusBanner && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span>{statusBanner}</span>
            <button type="button" onClick={() => setStatusBanner(null)} className="text-xs underline ml-3 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Actual User Data Used from Minimum 3GB Storage Quota & Usage Meter Card */}
        <div
          className={`mt-5 rounded-2xl border p-4 sm:p-5 transition-all ${
            isDarkMode
              ? "border-[#383832] bg-[#1C1C19]/90"
              : "border-sky-200/90 bg-white/95 shadow-2xs"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                <HardDrive size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm sm:text-base font-extrabold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                    User Storage Allocation: {formatBytes(metrics.usedStorageBytes)} Used from {formatStorageGB(metrics.totalCapacityBytes)} Storage
                  </h3>
                  <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300">
                    {metrics.usagePercentage}% Used
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                  {formatBytes(metrics.usedStorageBytes)} Actual User Data Used ({metrics.totalItems} saved {metrics.totalItems === 1 ? "item" : "items"}: uploaded files, notes, exams, flashcards & books) • {formatStorageGB(metrics.availableStorageBytes)} Remaining Free Space from Minimum {formatStorageGB(metrics.totalCapacityBytes)} Storage
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`rounded-xl border px-3 py-1.5 text-center ${
                  isDarkMode ? "border-[#383832] bg-[#262622]" : "border-sky-200 bg-sky-50/70"
                }`}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Used Data
                </span>
                <span className={`text-sm font-black ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                  {formatBytes(metrics.usedStorageBytes)}
                </span>
              </div>
              <div
                className={`rounded-xl border px-3 py-1.5 text-center ${
                  isDarkMode ? "border-[#383832] bg-[#262622]" : "border-emerald-200 bg-emerald-50/70"
                }`}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Free Space
                </span>
                <span className={`text-sm font-black ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                  {formatStorageGB(metrics.availableStorageBytes)}
                </span>
              </div>
              <div
                className={`rounded-xl border px-3 py-1.5 text-center ${
                  isDarkMode ? "border-[#383832] bg-[#262622]" : "border-indigo-200 bg-indigo-50/70"
                }`}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Min Total Storage
                </span>
                <span className={`text-sm font-black ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                  {formatStorageGB(metrics.totalCapacityBytes)}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Actual Used / Minimum 3GB Progress Bar */}
          <div className="space-y-1.5">
            <div
              className={`relative h-3.5 w-full overflow-hidden rounded-full border ${
                isDarkMode ? "border-[#383832] bg-[#2A2A26]" : "border-slate-200 bg-slate-100"
              }`}
            >
              <div
                style={{
                  width: `${
                    metrics.usedStorageBytes > 0
                      ? Math.min(100, Math.max(1.5, metrics.usagePercentage))
                      : 0
                  }%`,
                }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 transition-all duration-500"
              />
              {/* 1 GB and 2 GB Tick Dividers */}
              <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-slate-300/80 dark:bg-[#45453B]" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-slate-300/80 dark:bg-[#45453B]" />
            </div>
            <div className={`flex items-center justify-between text-[10px] font-bold ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
              <span>0 GB</span>
              <span className="text-sky-600 dark:text-sky-400">
                ● {formatBytes(metrics.usedStorageBytes)} Used ({metrics.usagePercentage}%)
              </span>
              <span>1 GB</span>
              <span>2 GB</span>
              <span className={isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}>
                {formatStorageGB(metrics.totalCapacityBytes)} Min Storage
              </span>
            </div>
          </div>
        </div>

        {/* Storage Breakdown Stat Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { id: "uploaded-files", label: "Uploaded Files", count: metrics.uploadedFilesCount, icon: FolderOpen, tone: "text-sky-600 bg-sky-500/10" },
            { id: "notes", label: "Handwritten Notes", count: metrics.notesCount, icon: BookOpen, tone: "text-amber-600 bg-amber-500/10" },
            { id: "questions", label: "Question Banks", count: metrics.questionsAndExamsCount, icon: FileQuestion, tone: "text-violet-600 bg-violet-500/10" },
            { id: "flashcards", label: "Flashcard Sets", count: metrics.flashcardSetsCount, icon: Layers, tone: "text-emerald-600 bg-emerald-500/10" },
            { id: "ppt-video", label: "PPT Slide Decks", count: metrics.pptDecksCount, icon: Presentation, tone: "text-pink-600 bg-pink-500/10" },
            { id: "ppt-video", label: "Video Lectures", count: metrics.videoLecturesCount, icon: FileVideo, tone: "text-indigo-600 bg-indigo-500/10" },
            { id: "lesson-plans", label: "Lesson Plans", count: metrics.lessonPlansCount, icon: Calendar, tone: "text-teal-600 bg-teal-500/10" },
            { id: "library", label: "E-Library Books", count: metrics.libraryBooksCount, icon: Archive, tone: "text-blue-600 bg-blue-500/10" },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <button
                key={`${stat.label}-${idx}`}
                type="button"
                onClick={() => setActiveTab(stat.id as StorageFilterTab)}
                className={`rounded-2xl border p-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 ${
                  isDarkMode
                    ? "border-[#383832] bg-[#2A2A26]/90 hover:border-sky-500/40"
                    : "border-slate-200/80 bg-white/90 hover:border-sky-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.tone}`}>
                    <Icon size={16} />
                  </span>
                  <span className={`text-lg font-extrabold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                    {stat.count}
                  </span>
                </div>
                <p className={`mt-2 text-[11px] font-semibold truncate ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>
                  {stat.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        className={`rounded-2xl border p-4 shadow-xs ${
          isDarkMode ? "border-[#383832] bg-[#22221F]/95" : "border-slate-200/80 bg-white/95"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: `All Stored Data (${metrics.totalItems})` },
                { id: "uploaded-files", label: `Uploaded Documents (${metrics.uploadedFilesCount})` },
                { id: "notes", label: `Notes & Handwriting (${metrics.notesCount})` },
                { id: "questions", label: `Questions & Exams (${metrics.questionsAndExamsCount})` },
                { id: "flashcards", label: `Flashcards (${metrics.flashcardSetsCount})` },
                { id: "ppt-video", label: `PPT & Video (${metrics.pptDecksCount + metrics.videoLecturesCount})` },
                { id: "lesson-plans", label: `Lesson Plans (${metrics.lessonPlansCount})` },
                { id: "library", label: `Saved Books (${metrics.libraryBooksCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : isDarkMode
                    ? "bg-[#2A2A26] text-[#C2C2B0] hover:bg-[#383832]"
                    : "bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stored files, notes, topics..."
              className={`w-full rounded-xl border pl-8 pr-3 py-2 text-xs outline-none transition-colors ${
                isDarkMode
                  ? "border-[#45453B] bg-[#2A2A26] text-[#F5F5F0] placeholder-[#8A8A7A] focus:border-sky-500"
                  : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Stored Items Sections */}
      {isLoading ? (
        <div className={`rounded-2xl border p-10 text-center text-sm ${isDarkMode ? "border-[#383832] bg-[#22221F] text-[#A1A194]" : "border-slate-200 bg-white text-slate-500"}`}>
          Loading your personal storage vault...
        </div>
      ) : filteredUploadedDocs.length === 0 && filteredStudyItems.length === 0 && filteredLibraryBooks.length === 0 ? (
        <div
          className={`rounded-3xl border border-dashed p-12 text-center ${
            isDarkMode ? "border-[#45453B] bg-[#22221F]/70" : "border-slate-300 bg-white/80"
          }`}
        >
          <Database size={36} className="mx-auto mb-3 text-sky-500 opacity-80" />
          <h3 className={`text-base font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-800"}`}>
            No Stored Records Match This Filter Yet
          </h3>
          <p className={`mt-1 text-xs max-w-md mx-auto ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
            Upload any digital document or generate study notes, flashcards, PPTs, or video lectures — everything is automatically saved here in your personal storage vault.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Uploaded Digital Document Files */}
          {filteredUploadedDocs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-sky-300" : "text-sky-800"}`}>
                  <FolderOpen size={16} /> Stored Digital Document Files ({filteredUploadedDocs.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-md ${
                      isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-200/90 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                            {doc.uploadSource || "Stored Digital Document"} • {formatBytes(doc.fileSize)}
                          </span>
                          <h4 className={`text-sm font-bold truncate ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                            {doc.fileName}
                          </h4>
                          <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                            Saved {formatTimestamp(doc.updatedAtMs)}
                            {doc.digitalScan?.pageCount ? ` • ${doc.digitalScan.pageCount} Pages` : ""}
                            {doc.digitalScan?.wordCount ? ` • ${doc.digitalScan.wordCount.toLocaleString()} Words` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#383832]">
                      <button
                        type="button"
                        onClick={() => onOpenUploadedDocument(doc)}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>Load in Workspace</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadStoredDocument(doc)}
                        className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                          isDarkMode
                            ? "border-[#45453B] bg-[#2A2A26] text-[#E0E0D5] hover:bg-[#383832]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteUploadedDoc(doc.id)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          isDarkMode
                            ? "border-[#45453B] text-red-400 hover:bg-red-950/40"
                            : "border-slate-200 text-red-600 hover:bg-red-50"
                        }`}
                        title="Delete from storage"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. Generated Study Outputs (Notes, Handwriting, Questions, Flashcards, PPT, Video, Lesson Plans) */}
          {filteredStudyItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-indigo-300" : "text-indigo-900"}`}>
                  <Sparkles size={16} /> Stored Study Outputs & Generated Content ({filteredStudyItems.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredStudyItems.map((item) => {
                  const badge = getTypeBadge(item.type);
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-md ${
                        isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-200/90 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${badge.color}`}>
                          <BadgeIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatBytes(item.sizeBytes)}
                            </span>
                          </div>
                          <h4 className={`text-sm font-bold truncate ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                            {item.title}
                          </h4>
                          <p className={`text-[11px] mt-0.5 truncate ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                            Saved {formatTimestamp(item.updatedAtMs || item.createdAtMs)}
                            {item.focusArea ? ` • Focus: ${item.focusArea}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#383832]">
                        <button
                          type="button"
                          onClick={() => onOpenStudyItem(item)}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span>Open Output</span>
                          <ArrowRight size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadStoredStudyItem(item)}
                          className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            isDarkMode
                              ? "border-[#45453B] bg-[#2A2A26] text-[#E0E0D5] hover:bg-[#383832]"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteStudyItem(item.id)}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            isDarkMode
                              ? "border-[#45453B] text-red-400 hover:bg-red-950/40"
                              : "border-slate-200 text-red-600 hover:bg-red-50"
                          }`}
                          title="Delete from storage"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Personal Saved Library Books */}
          {filteredLibraryBooks.length > 0 && (
            <section className="space-y-3">
              <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                <Archive size={16} /> Personal E-Library Books ({filteredLibraryBooks.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredLibraryBooks.map((book) => (
                  <div
                    key={book.id}
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                      isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {book.department}
                      </span>
                      <h4 className={`text-sm font-bold truncate ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
                        {book.title}
                      </h4>
                      <p className={`text-xs truncate ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
                        {book.author}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenLibraryBook(book)}
                      className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold cursor-pointer"
                    >
                      Study Book →
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
