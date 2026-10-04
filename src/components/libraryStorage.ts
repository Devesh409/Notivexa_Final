import type { LibraryBook } from "./LibraryPanel";

const DATABASE_NAME = "notivexa-personal-library";
const DATABASE_VERSION = 1;
const BOOKS_STORE = "books";
const FILES_STORE = "files";

export interface SavedLibraryBook extends LibraryBook {
  storageType: "file" | "link";
  fileName?: string;
  createdAt: number;
}

interface StoredBookFile {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
}

function openLibraryDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support local book storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BOOKS_STORE)) {
        database.createObjectStore(BOOKS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(FILES_STORE)) {
        database.createObjectStore(FILES_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local book storage."));
  });
}

export async function listSavedLibraryBooks(): Promise<SavedLibraryBook[]> {
  const database = await openLibraryDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(BOOKS_STORE, "readonly").objectStore(BOOKS_STORE).getAll();
      request.onsuccess = () => resolve((request.result as SavedLibraryBook[]).sort((a, b) => b.createdAt - a.createdAt));
      request.onerror = () => reject(request.error || new Error("Could not load saved books."));
    });
  } finally {
    database.close();
  }
}

export async function saveLibraryBook(book: SavedLibraryBook, file?: File): Promise<void> {
  const database = await openLibraryDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(file ? [BOOKS_STORE, FILES_STORE] : [BOOKS_STORE], "readwrite");
      transaction.objectStore(BOOKS_STORE).put(book);
      if (file) {
        const storedFile: StoredBookFile = {
          id: book.id,
          blob: file,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
        };
        transaction.objectStore(FILES_STORE).put(storedFile);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Could not save the book on this device."));
      transaction.onabort = () => reject(transaction.error || new Error("Saving the book was interrupted."));
    });
  } finally {
    database.close();
  }
}

export async function getSavedLibraryBookFile(id: string): Promise<File | null> {
  const database = await openLibraryDatabase();
  try {
    const storedFile = await new Promise<StoredBookFile | undefined>((resolve, reject) => {
      const request = database.transaction(FILES_STORE, "readonly").objectStore(FILES_STORE).get(id);
      request.onsuccess = () => resolve(request.result as StoredBookFile | undefined);
      request.onerror = () => reject(request.error || new Error("Could not read the saved book file."));
    });
    if (!storedFile) return null;
    return new File([storedFile.blob], storedFile.fileName, { type: storedFile.mimeType });
  } finally {
    database.close();
  }
}

export async function deleteSavedLibraryBook(id: string): Promise<void> {
  const database = await openLibraryDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([BOOKS_STORE, FILES_STORE], "readwrite");
      transaction.objectStore(BOOKS_STORE).delete(id);
      transaction.objectStore(FILES_STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Could not remove the saved book."));
      transaction.onabort = () => reject(transaction.error || new Error("Removing the book was interrupted."));
    });
  } finally {
    database.close();
  }
}
