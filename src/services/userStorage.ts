import { listSavedLibraryBooks, type SavedLibraryBook } from "../components/libraryStorage";

const VAULT_DB_NAME = "notivexa-user-storage-vault";
const VAULT_DB_VERSION = 1;

const STORE_STUDY_ITEMS = "study_items";
const STORE_UPLOADED_FILES = "uploaded_files";
const STORE_WORKSPACE_STATE = "workspace_state";
const STORE_CHAT_HISTORY = "chat_history";

export interface StoredStudyItem {
  id: string;
  userKey: string;
  title: string;
  type: string;
  questionBankType?: string;
  questionBankBloomLevel?: string;
  qbVersion?: number;
  notesVersion?: number;
  fileUri: string;
  mimeType: string;
  resultText: string;
  slides?: any[];
  flashcards: { term: string; definition: string }[];
  videoData?: any | null;
  lessonPlan?: any | null;
  focusArea: string;
  createdAt?: any;
  createdAtMs: number;
  updatedAtMs: number;
  sizeBytes: number;
}

export interface StoredUploadedDocument {
  id: string;
  userKey: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadSource: string;
  extractedText: string;
  digitalScan?: any | null;
  detectedUnits?: any[];
  blob?: Blob | null;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface UserPreferencesState {
  mode: string;
  pageStyle: string;
  penColor: string;
  handwritingFont: string;
  isDarkMode: boolean;
  uiZoomMode: string;
  selectedAiModel: string;
  focusArea: string;
  selectedUnit: string;
  selectedChapter: string;
  noteDepthTarget: number;
  chapterScopeStyle: string;
  pptTheme: string;
  flashcardThemeStyle: string;
}

export interface UserWorkspaceSnapshot {
  id: string;
  userKey: string;
  activeFileName?: string;
  activeFileUri?: string;
  activeMimeType?: string;
  fileName?: string;
  fileSize?: number;
  fileData?: { fileUri: string; mimeType: string } | null;
  scannedDigitalText?: string;
  digitalScanReport?: any | null;
  detectedUnits?: any[];
  resultText?: string;
  resultType?: string;
  activeMultiFunctionTitle?: string;
  flashcards?: { term: string; definition: string }[];
  slides?: any[];
  videoData?: any | null;
  lessonPlan?: any | null;
  generatedFunctionsCache?: Record<string, any>;
  completedSessions?: string[] | Record<string, boolean>;
  preferences?: Partial<UserPreferencesState>;
  updatedAtMs: number;
}

export const USER_STORAGE_BASE_USED_BYTES = 0; // Actual user data starts at 0 B
export const USER_STORAGE_TOTAL_CAPACITY_BYTES = 3 * 1024 * 1024 * 1024; // Minimum 3 GB Storage

export interface StorageCategoryMetrics {
  totalItems: number;
  totalBytes: number;
  usedStorageBytes: number;
  totalCapacityBytes: number;
  availableStorageBytes: number;
  usagePercentage: number;
  uploadedFilesCount: number;
  notesCount: number;
  questionsAndExamsCount: number;
  flashcardSetsCount: number;
  pptDecksCount: number;
  videoLecturesCount: number;
  lessonPlansCount: number;
  libraryBooksCount: number;
  lastSavedAtMs: number | null;
}

function estimatePayloadBytes(obj: unknown): number {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return 1024;
  }
}

function openVaultDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not supported in this browser environment."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_STUDY_ITEMS)) {
        const store = db.createObjectStore(STORE_STUDY_ITEMS, { keyPath: "id" });
        store.createIndex("by_user", "userKey", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_UPLOADED_FILES)) {
        const store = db.createObjectStore(STORE_UPLOADED_FILES, { keyPath: "id" });
        store.createIndex("by_user", "userKey", { unique: false });
        store.createIndex("by_uri", "fileUri", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_WORKSPACE_STATE)) {
        db.createObjectStore(STORE_WORKSPACE_STATE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CHAT_HISTORY)) {
        db.createObjectStore(STORE_CHAT_HISTORY, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open Notivexa User Storage Vault."));
  });
}

export function getEffectiveUserStorageKey(uid?: string | null, email?: string | null): string {
  if (uid && uid.trim()) return `user_${uid.trim()}`;
  if (email && email.trim()) return `email_${email.trim().toLowerCase()}`;
  return "local_primary_user";
}

export async function saveStudyItemToVault(
  userKey: string,
  item: Omit<StoredStudyItem, "userKey" | "createdAtMs" | "updatedAtMs" | "sizeBytes"> & {
    createdAtMs?: number;
  }
): Promise<StoredStudyItem> {
  const now = Date.now();
  const fullItem: StoredStudyItem = {
    ...item,
    userKey,
    createdAtMs: item.createdAtMs || now,
    updatedAtMs: now,
    sizeBytes: estimatePayloadBytes(item),
  };

  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_STUDY_ITEMS, "readwrite");
        tx.objectStore(STORE_STUDY_ITEMS).put(fullItem);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn("IndexedDB saveStudyItemToVault fallback to localStorage:", err);
    try {
      const raw = localStorage.getItem(`notivexa_vault_items_${userKey}`);
      const list: StoredStudyItem[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((x) => x.id !== fullItem.id);
      filtered.unshift(fullItem);
      localStorage.setItem(`notivexa_vault_items_${userKey}`, JSON.stringify(filtered.slice(0, 40)));
    } catch {
      // Ignore quota
    }
  }

  // Also mirror lightweight metadata to backend storage
  void syncItemToBackendVault(userKey, "study_item", fullItem);
  return fullItem;
}

export function formatStorageBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatStorageGB(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024 * 1024) {
    return formatStorageBytes(bytes);
  }
  const gb = bytes / (1024 * 1024 * 1024);
  if (Math.abs(gb - Math.round(gb)) < 0.0001) {
    return `${Math.round(gb)} GB`;
  }
  const truncatedTwoDecimals = Math.floor(gb * 100) / 100;
  return `${truncatedTwoDecimals.toFixed(2)} GB`;
}

async function fetchBackendVault(
  userKey: string
): Promise<{ studyItems: StoredStudyItem[]; uploadedDocs: StoredUploadedDocument[]; workspaceSnapshot?: UserWorkspaceSnapshot }> {
  try {
    const res = await fetch(`/api/user-storage/get?userKey=${encodeURIComponent(userKey || "local_primary_user")}`);
    if (!res.ok) return { studyItems: [], uploadedDocs: [] };
    const data = await res.json();
    return {
      studyItems: Array.isArray(data?.studyItems) ? data.studyItems : [],
      uploadedDocs: Array.isArray(data?.uploadedDocs) ? data.uploadedDocs : [],
      workspaceSnapshot: data?.workspaceSnapshot || undefined,
    };
  } catch {
    return { studyItems: [], uploadedDocs: [] };
  }
}

export async function listStudyItemsFromVault(userKey: string): Promise<StoredStudyItem[]> {
  let localList: StoredStudyItem[] = [];
  try {
    const db = await openVaultDatabase();
    try {
      const allItems = await new Promise<StoredStudyItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_STUDY_ITEMS, "readonly");
        const req = tx.objectStore(STORE_STUDY_ITEMS).getAll();
        req.onsuccess = () => resolve((req.result as StoredStudyItem[]) || []);
        req.onerror = () => reject(req.error);
      });
      localList = allItems.filter(
        (item) => item.userKey === userKey || item.userKey === "local_primary_user"
      );
    } finally {
      db.close();
    }
  } catch {
    try {
      const raw = localStorage.getItem(`notivexa_vault_items_${userKey}`);
      localList = raw ? JSON.parse(raw) : [];
    } catch {
      localList = [];
    }
  }

  const remote = await fetchBackendVault(userKey);
  const merged = new Map<string, StoredStudyItem>();
  for (const item of [...localList, ...remote.studyItems]) {
    if (item && item.id && !merged.has(item.id)) {
      merged.set(item.id, item);
    }
  }
  return Array.from(merged.values()).sort(
    (a, b) => (b.updatedAtMs || b.createdAtMs || 0) - (a.updatedAtMs || a.createdAtMs || 0)
  );
}

export async function deleteStudyItemFromVault(id: string, userKey?: string): Promise<void> {
  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_STUDY_ITEMS, "readwrite");
        tx.objectStore(STORE_STUDY_ITEMS).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    // Fallback
  }
  if (userKey) {
    try {
      const raw = localStorage.getItem(`notivexa_vault_items_${userKey}`);
      if (raw) {
        const list: StoredStudyItem[] = JSON.parse(raw);
        localStorage.setItem(
          `notivexa_vault_items_${userKey}`,
          JSON.stringify(list.filter((x) => x.id !== id))
        );
      }
    } catch {
      // Ignore
    }
  }
  void fetch("/api/user-storage/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey: userKey || "local_primary_user", kind: "study_item", id }),
  }).catch(() => {});
}

export async function saveUploadedDocumentToVault(
  userKey: string,
  docInput: {
    id?: string;
    fileUri: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
    uploadSource?: string;
    extractedText?: string;
    digitalScan?: any | null;
    detectedUnits?: any[];
    fileBlob?: Blob | File | null;
  }
): Promise<StoredUploadedDocument> {
  const now = Date.now();
  const docId = docInput.id || `doc_${docInput.fileUri.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const computedSize =
    docInput.fileSize ||
    (docInput.fileBlob ? docInput.fileBlob.size : 0) ||
    estimatePayloadBytes(docInput.extractedText || "");

  const record: StoredUploadedDocument = {
    id: docId,
    userKey,
    fileUri: docInput.fileUri,
    fileName: docInput.fileName || "Uploaded_Digital_Document",
    mimeType: docInput.mimeType || "application/pdf",
    fileSize: computedSize,
    uploadSource: docInput.uploadSource || "Direct Upload",
    extractedText: docInput.extractedText || "",
    digitalScan: docInput.digitalScan || null,
    detectedUnits: docInput.detectedUnits || [],
    blob: docInput.fileBlob || null,
    createdAtMs: now,
    updatedAtMs: now,
  };

  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_UPLOADED_FILES, "readwrite");
        tx.objectStore(STORE_UPLOADED_FILES).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn("Could not store uploaded document blob in IndexedDB:", err);
  }

  const { blob: _omitBlob, ...lightweightRecord } = record;
  void syncItemToBackendVault(userKey, "uploaded_doc", lightweightRecord);
  return record;
}

export async function listUploadedDocumentsFromVault(userKey: string): Promise<StoredUploadedDocument[]> {
  let localDocs: StoredUploadedDocument[] = [];
  try {
    const db = await openVaultDatabase();
    try {
      const allDocs = await new Promise<StoredUploadedDocument[]>((resolve, reject) => {
        const tx = db.transaction(STORE_UPLOADED_FILES, "readonly");
        const req = tx.objectStore(STORE_UPLOADED_FILES).getAll();
        req.onsuccess = () => resolve((req.result as StoredUploadedDocument[]) || []);
        req.onerror = () => reject(req.error);
      });
      localDocs = allDocs.filter(
        (doc) => doc.userKey === userKey || doc.userKey === "local_primary_user"
      );
    } finally {
      db.close();
    }
  } catch {
    localDocs = [];
  }

  const remote = await fetchBackendVault(userKey);
  const merged = new Map<string, StoredUploadedDocument>();
  for (const docItem of [...localDocs, ...remote.uploadedDocs]) {
    if (docItem && docItem.id && !merged.has(docItem.id)) {
      merged.set(docItem.id, docItem);
    }
  }
  return Array.from(merged.values()).sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
}

export async function getUploadedDocumentFromVault(
  fileUriOrId: string
): Promise<StoredUploadedDocument | null> {
  try {
    const db = await openVaultDatabase();
    try {
      const allDocs = await new Promise<StoredUploadedDocument[]>((resolve, reject) => {
        const tx = db.transaction(STORE_UPLOADED_FILES, "readonly");
        const req = tx.objectStore(STORE_UPLOADED_FILES).getAll();
        req.onsuccess = () => resolve((req.result as StoredUploadedDocument[]) || []);
        req.onerror = () => reject(req.error);
      });
      return (
        allDocs.find((d) => d.id === fileUriOrId || d.fileUri === fileUriOrId) || null
      );
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function deleteUploadedDocumentFromVault(id: string, userKey?: string): Promise<void> {
  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_UPLOADED_FILES, "readwrite");
        tx.objectStore(STORE_UPLOADED_FILES).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    // Ignore
  }
  void fetch("/api/user-storage/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey: userKey || "local_primary_user", kind: "uploaded_doc", id }),
  }).catch(() => {});
}

export async function saveWorkspaceSnapshot(
  userKey: string,
  snapshot: Omit<UserWorkspaceSnapshot, "id" | "userKey" | "updatedAtMs">
): Promise<UserWorkspaceSnapshot> {
  const fullSnapshot: UserWorkspaceSnapshot = {
    ...snapshot,
    id: `workspace_${userKey}`,
    userKey,
    updatedAtMs: Date.now(),
  };

  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_WORKSPACE_STATE, "readwrite");
        tx.objectStore(STORE_WORKSPACE_STATE).put(fullSnapshot);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    // Fallback to localStorage for preferences & active metadata
  }

  try {
    if (snapshot.preferences) {
      localStorage.setItem(
        `notivexa_user_prefs_${userKey}`,
        JSON.stringify(snapshot.preferences)
      );
    }
  } catch {
    // Ignore storage quota
  }

  return fullSnapshot;
}

export async function loadWorkspaceSnapshot(
  userKey: string
): Promise<UserWorkspaceSnapshot | null> {
  try {
    const db = await openVaultDatabase();
    try {
      const record = await new Promise<UserWorkspaceSnapshot | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_WORKSPACE_STATE, "readonly");
        const req = tx.objectStore(STORE_WORKSPACE_STATE).get(`workspace_${userKey}`);
        req.onsuccess = () => resolve(req.result as UserWorkspaceSnapshot | undefined);
        req.onerror = () => reject(req.error);
      });
      if (record) return record;

      // Also check fallback guest key if user just signed in
      if (userKey !== "local_primary_user") {
        const guestRecord = await new Promise<UserWorkspaceSnapshot | undefined>((resolve, reject) => {
          const tx = db.transaction(STORE_WORKSPACE_STATE, "readonly");
          const req = tx.objectStore(STORE_WORKSPACE_STATE).get("workspace_local_primary_user");
          req.onsuccess = () => resolve(req.result as UserWorkspaceSnapshot | undefined);
          req.onerror = () => reject(req.error);
        });
        if (guestRecord) return guestRecord;
      }
      return null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function saveChatHistoryToVault(
  userKey: string,
  fileUri: string | undefined,
  messages: Array<{ role: string; text: string; timestamp?: number }>
): Promise<void> {
  const key = `chat_${userKey}_${fileUri || "global"}`;
  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CHAT_HISTORY, "readwrite");
        tx.objectStore(STORE_CHAT_HISTORY).put({
          id: key,
          userKey,
          fileUri: fileUri || "global",
          messages,
          updatedAtMs: Date.now(),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    // Ignore
  }
}

export async function loadChatHistoryFromVault(
  userKey: string,
  fileUri: string | undefined
): Promise<Array<{ role: "user" | "model"; text: string }> | null> {
  const key = `chat_${userKey}_${fileUri || "global"}`;
  try {
    const db = await openVaultDatabase();
    try {
      const record = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction(STORE_CHAT_HISTORY, "readonly");
        const req = tx.objectStore(STORE_CHAT_HISTORY).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return record?.messages || null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function getStorageMetrics(userKey: string): Promise<StorageCategoryMetrics> {
  const [studyItems, uploadedDocs, libraryBooks, snapshot] = await Promise.all([
    listStudyItemsFromVault(userKey),
    listUploadedDocumentsFromVault(userKey),
    listSavedLibraryBooks().catch(() => [] as SavedLibraryBook[]),
    loadWorkspaceSnapshot(userKey),
  ]);

  let totalBytes = 0;
  for (const item of studyItems) {
    totalBytes += item.sizeBytes || estimatePayloadBytes(item);
  }
  for (const doc of uploadedDocs) {
    totalBytes += doc.fileSize || estimatePayloadBytes(doc.extractedText || "");
  }
  for (const book of libraryBooks) {
    totalBytes += estimatePayloadBytes(book);
  }
  if (snapshot) {
    totalBytes += estimatePayloadBytes({
      resultText: snapshot.resultText,
      scannedDigitalText: snapshot.scannedDigitalText,
    });
  }

  const notesCount = studyItems.filter((i) =>
    [
      "notes",
      "verbatim-handwriting",
      "handwritten-table-form",
      "executive-summary",
      "formula-sheet",
      "glossary",
      "mindmap-atlas",
      "cheat-sheet",
    ].includes(i.type)
  ).length;

  const questionsAndExamsCount = studyItems.filter((i) =>
    ["question-bank", "short-questions", "assessment", "exam-paper", "viva-qa"].includes(i.type)
  ).length;

  const flashcardSetsCount = studyItems.filter(
    (i) => i.type === "flashcards" || (Array.isArray(i.flashcards) && i.flashcards.length > 0)
  ).length;

  const pptDecksCount = studyItems.filter(
    (i) => i.type === "ppt" || (Array.isArray(i.slides) && i.slides.length > 0)
  ).length;

  const videoLecturesCount = studyItems.filter(
    (i) => i.type === "video" || Boolean(i.videoData)
  ).length;

  const lessonPlansCount = studyItems.filter(
    (i) => i.type === "lesson-plan" || Boolean(i.lessonPlan)
  ).length;

  const timestamps = [
    ...studyItems.map((i) => i.updatedAtMs || i.createdAtMs || 0),
    ...uploadedDocs.map((d) => d.updatedAtMs || d.createdAtMs || 0),
    snapshot?.updatedAtMs || 0,
  ].filter((t) => t > 0);

  // Also include chat history records stored in IndexedDB so all user data is counted
  try {
    const db = await openVaultDatabase();
    try {
      const chatRecords = await new Promise<any[]>((resolve) => {
        const tx = db.transaction(STORE_CHAT_HISTORY, "readonly");
        const req = tx.objectStore(STORE_CHAT_HISTORY).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
      for (const rec of chatRecords) {
        if (!rec?.userKey || rec.userKey === userKey || rec.userKey === "local_primary_user") {
          totalBytes += estimatePayloadBytes(rec.messages || []);
        }
      }
    } finally {
      db.close();
    }
  } catch {
    // Ignore
  }

  const usedStorageBytes = Math.max(0, USER_STORAGE_BASE_USED_BYTES + totalBytes);
  const totalCapacityBytes = Math.max(USER_STORAGE_TOTAL_CAPACITY_BYTES, usedStorageBytes);
  const availableStorageBytes = Math.max(0, totalCapacityBytes - usedStorageBytes);
  const rawPct = totalCapacityBytes > 0 ? (usedStorageBytes / totalCapacityBytes) * 100 : 0;
  const usagePercentage =
    usedStorageBytes <= 0
      ? 0
      : rawPct < 0.01
      ? 0.01
      : rawPct < 1
      ? Number(rawPct.toFixed(2))
      : Number(rawPct.toFixed(1));

  return {
    totalItems: studyItems.length + uploadedDocs.length + libraryBooks.length,
    totalBytes,
    usedStorageBytes,
    totalCapacityBytes,
    availableStorageBytes,
    usagePercentage,
    uploadedFilesCount: uploadedDocs.length,
    notesCount,
    questionsAndExamsCount,
    flashcardSetsCount,
    pptDecksCount,
    videoLecturesCount,
    lessonPlansCount,
    libraryBooksCount: libraryBooks.length,
    lastSavedAtMs: timestamps.length > 0 ? Math.max(...timestamps) : null,
  };
}

export async function exportFullUserVaultJSON(userKey: string): Promise<string> {
  const [studyItems, uploadedDocs, libraryBooks, workspaceSnapshot] = await Promise.all([
    listStudyItemsFromVault(userKey),
    listUploadedDocumentsFromVault(userKey),
    listSavedLibraryBooks().catch(() => [] as SavedLibraryBook[]),
    loadWorkspaceSnapshot(userKey),
  ]);

  const serializableUploadedDocs = uploadedDocs.map(({ blob: _blob, ...rest }) => rest);

  const backupPayload = {
    vaultVersion: 1,
    exportedAt: new Date().toISOString(),
    userKey,
    studyItems,
    uploadedDocuments: serializableUploadedDocs,
    personalLibraryBooks: libraryBooks,
    workspaceSnapshot,
  };

  return JSON.stringify(backupPayload, null, 2);
}

export async function importFullUserVaultJSON(
  userKey: string,
  jsonString: string
): Promise<{ importedItemsCount: number; importedDocsCount: number }> {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup file format.");
  }

  let importedItemsCount = 0;
  let importedDocsCount = 0;

  if (Array.isArray(parsed.studyItems)) {
    for (const item of parsed.studyItems) {
      if (item && item.id && item.title) {
        await saveStudyItemToVault(userKey, {
          ...item,
          createdAtMs: item.createdAtMs || Date.now(),
        });
        importedItemsCount++;
      }
    }
  }

  if (Array.isArray(parsed.uploadedDocuments)) {
    for (const docItem of parsed.uploadedDocuments) {
      if (docItem && docItem.fileUri) {
        await saveUploadedDocumentToVault(userKey, docItem);
        importedDocsCount++;
      }
    }
  }

  if (parsed.workspaceSnapshot && typeof parsed.workspaceSnapshot === "object") {
    await saveWorkspaceSnapshot(userKey, parsed.workspaceSnapshot);
  }

  return { importedItemsCount, importedDocsCount };
}

export async function clearAllUserVaultData(userKey: string): Promise<void> {
  try {
    const db = await openVaultDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(
          [STORE_STUDY_ITEMS, STORE_UPLOADED_FILES, STORE_WORKSPACE_STATE, STORE_CHAT_HISTORY],
          "readwrite"
        );
        tx.objectStore(STORE_STUDY_ITEMS).clear();
        tx.objectStore(STORE_UPLOADED_FILES).clear();
        tx.objectStore(STORE_WORKSPACE_STATE).clear();
        tx.objectStore(STORE_CHAT_HISTORY).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    // Ignore
  }

  try {
    localStorage.removeItem(`notivexa_vault_items_${userKey}`);
    localStorage.removeItem(`notivexa_user_prefs_${userKey}`);
  } catch {
    // Ignore
  }

  void fetch("/api/user-storage/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey }),
  }).catch(() => {});
}

async function syncItemToBackendVault(userKey: string, kind: string, payload: any): Promise<void> {
  try {
    await fetch("/api/user-storage/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey, kind, payload }),
    });
  } catch {
    // Non-blocking server mirror
  }
}
