import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Atom,
  BookMarked,
  BookOpen,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileUp,
  GraduationCap,
  Palette,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  desc: string;
  department: string;
  fileUri?: string;
  mimeType?: string;
  sourceUrl?: string;
  storageType?: "file" | "link";
  fileName?: string;
}

interface LibraryPanelProps {
  books: LibraryBook[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  selectedFileUri?: string;
  isDarkMode: boolean;
  onStudyBook: (book: LibraryBook) => void | Promise<void>;
  onDownloadBook: (book: LibraryBook) => void | Promise<void>;
  onAddBookLink: (url: string, department: string) => Promise<void>;
  onAddLocalBook: (file: File, department: string) => Promise<void>;
  onRemoveBook: (book: LibraryBook) => Promise<void>;
  busyBookId?: string | null;
}

const departments = ["All", "Personal", "MCA", "BCA", "Engineering", "Pharmacy", "Commerce", "Science", "Arts"];

function getCoverStyle(book: LibraryBook) {
  const searchableText = `${book.title} ${book.desc}`.toLowerCase();
  if (/cyber|security|network|privacy/.test(searchableText)) {
    return { gradient: "from-[#071a36] via-[#174e72] to-[#2c8792]", icon: ShieldCheck, seal: "DIGITAL FRONTIERS" };
  }
  if (/database|data systems|sql/.test(searchableText)) {
    return { gradient: "from-[#211d4b] via-[#444c99] to-[#6a9ddb]", icon: Database, seal: "SYSTEMS & DATA" };
  }

  switch (book.department.toLowerCase()) {
    case "mca": return { gradient: "from-[#172c52] via-[#276d9b] to-[#4b9ea2]", icon: Code2, seal: "COMPUTING STUDIES" };
    case "bca": return { gradient: "from-[#102a43] via-[#247a86] to-[#7ac1b1]", icon: BookMarked, seal: "COMPUTER SCIENCE" };
    case "engineering": return { gradient: "from-[#172c52] via-[#276d9b] to-[#4b9ea2]", icon: GraduationCap, seal: "ENGINEERING" };
    case "pharmacy": return { gradient: "from-[#302148] via-[#6547a5] to-[#be8fca]", icon: Pill, seal: "HEALTH SCIENCES" };
    case "commerce": return { gradient: "from-[#3d2b17] via-[#93651f] to-[#e2b96b]", icon: TrendingUp, seal: "BUSINESS & FINANCE" };
    case "science": return { gradient: "from-[#0f3b38] via-[#166d68] to-[#9caa75]", icon: Atom, seal: "SCIENCE COLLECTION" };
    case "arts": return { gradient: "from-[#4b1633] via-[#8f3f54] to-[#e1aa72]", icon: Palette, seal: "ARTS & HUMANITIES" };
    default: return { gradient: "from-[#19304f] via-[#3e6490] to-[#a3b4c2]", icon: BookOpen, seal: "PERSONAL COLLECTION" };
  }
}

function BookCover({ book, large = false, onClick }: { book: LibraryBook; large?: boolean; onClick?: () => void }) {
  const cover = getCoverStyle(book);
  const CoverIcon = cover.icon;
  const coverClass = `group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-br ${cover.gradient} text-left text-white shadow-lg ${large ? "aspect-[3/4] max-h-[540px]" : "h-48"}`;
  const artwork = (
    <>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-3 bg-black/20 shadow-[3px_0_12px_rgba(0,0,0,0.18)]" />
      <span aria-hidden="true" className="absolute -right-14 -top-16 h-56 w-56 rounded-full border border-white/15" />
      <span aria-hidden="true" className="absolute -right-4 -top-7 h-36 w-36 rounded-full border border-white/10" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/35" />
      <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
      <span aria-hidden="true" className="absolute bottom-8 right-8 opacity-[0.13] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
        <CoverIcon size={large ? 150 : 100} strokeWidth={0.8} />
      </span>
      <span className={`relative flex h-full flex-col justify-between ${large ? "p-8 sm:p-10" : "p-5"}`}>
        <span className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/75">
          <span className="truncate">{book.department} • {cover.seal}</span>
          <BookOpen size={14} className="shrink-0 text-white/80" />
        </span>
        <span className="relative z-10 max-w-[90%]">
          <span className={`mb-3 flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-white/70 ${large ? "text-xs" : "text-[9px]"}`}>
            <span className="h-px w-6 bg-white/70" /> NOTIVEXA • READER'S EDITION
          </span>
          <span className={`block line-clamp-3 font-serif font-bold leading-[1.05] drop-shadow-sm ${large ? "text-3xl sm:text-4xl" : "text-xl"}`}>{book.title}</span>
          <span className={`mt-3 block truncate text-white/75 ${large ? "text-sm" : "text-xs"}`}>{book.author}</span>
        </span>
        <span className="flex items-center justify-between border-t border-white/25 pt-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70">
          <span>STUDY • DISCOVER • GROW</span>
          <Sparkles size={14} />
        </span>
      </span>
      {onClick && <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/35 px-4 py-2 text-center text-xs font-semibold backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">Open book preview</span>}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} aria-label={`Preview cover for ${book.title}`} className={`${coverClass} cursor-zoom-in`}>
      {artwork}
    </button>
  ) : (
    <div aria-hidden="true" className={coverClass}>{artwork}</div>
  );
}

export function LibraryPanel({
  books,
  searchQuery,
  onSearchQueryChange,
  selectedDepartment,
  onDepartmentChange,
  selectedFileUri,
  isDarkMode,
  onStudyBook,
  onDownloadBook,
  onAddBookLink,
  onAddLocalBook,
  onRemoveBook,
  busyBookId,
}: LibraryPanelProps) {
  const [bookLinkUrl, setBookLinkUrl] = React.useState("");
  const [newBookDepartment, setNewBookDepartment] = React.useState("Personal");
  const [isSavingBook, setIsSavingBook] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");
  const [saveError, setSaveError] = React.useState("");
  const [previewBook, setPreviewBook] = React.useState<LibraryBook | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!previewBook) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewBook(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewBook]);

  const handleSaveGoogleBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");
    setSaveMessage("");
    setIsSavingBook(true);
    try {
      await onAddBookLink(bookLinkUrl, newBookDepartment);
      setBookLinkUrl("");
      setSaveMessage("Book link saved on this device.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save this book link.");
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleLocalBookPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selectedFile) return;
    setSaveError("");
    setSaveMessage("");
    setIsSavingBook(true);
    try {
      await onAddLocalBook(selectedFile, newBookDepartment);
      setSaveMessage(`${selectedFile.name} saved on this device.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save this book file.");
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleRemoveBook = async (book: LibraryBook) => {
    setSaveError("");
    setSaveMessage("");
    try {
      await onRemoveBook(book);
      if (previewBook?.id === book.id) setPreviewBook(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not remove this book.");
    }
  };

  const handleDownloadBook = async (book: LibraryBook) => {
    setSaveError("");
    try {
      await onDownloadBook(book);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not download this book.");
    }
  };

  const filteredBooks = books.filter((book) => {
    if (selectedDepartment !== "All" && book.department !== selectedDepartment) return false;
    const query = searchQuery.trim().toLowerCase();
    return !query || [book.title, book.author, book.desc].some((value) => value.toLowerCase().includes(query));
  });

  const personalBookCount = books.filter((book) => Boolean(book.storageType)).length;
  const studyBook = (book: LibraryBook) => {
    setPreviewBook(null);
    void onStudyBook(book);
  };

  return (
    <motion.section
      id="dashboard-library"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-6xl space-y-6 scroll-mt-6"
    >
      <header className={`relative isolate overflow-hidden rounded-[28px] border px-6 py-7 sm:px-8 sm:py-9 ${isDarkMode ? "border-[#383832] bg-gradient-to-br from-[#22221F] via-[#252924] to-[#1b3644]" : "border-white/70 bg-gradient-to-br from-[#f8fcff] via-[#eff7fb] to-[#e3edf2] shadow-sm"}`}>
        <div aria-hidden="true" className="absolute -right-16 -top-28 h-72 w-72 rounded-full border border-sky-400/15" />
        <div aria-hidden="true" className="absolute -right-1 -top-16 h-48 w-48 rounded-full border border-sky-400/15" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-sky-200 bg-white/70 text-sky-800"}`}>
              <Sparkles size={13} /> Your learning shelf
            </motion.div>
            <h2 className={`font-serif text-3xl font-bold tracking-tight sm:text-4xl ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>E-Library</h2>
            <p className={`mt-2 max-w-xl text-sm leading-relaxed sm:text-base ${isDarkMode ? "text-[#B7C2C3]" : "text-slate-600"}`}>
              A home for the books you love, the ideas you explore, and the next thing you learn.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isDarkMode ? "bg-white/10 text-white/85" : "bg-white/80 text-slate-700 shadow-sm"}`}>{books.length} books in your library</span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isDarkMode ? "bg-white/10 text-white/85" : "bg-white/80 text-slate-700 shadow-sm"}`}>{personalBookCount} added by you</span>
            </div>
          </div>
          <div aria-hidden="true" className="relative hidden h-40 w-48 shrink-0 items-end justify-center sm:flex">
            <div className="absolute bottom-1 left-4 h-32 w-20 -rotate-[15deg] rounded-l-md rounded-r-sm border-l-4 border-amber-200/70 bg-gradient-to-br from-rose-700 to-amber-500 shadow-xl" />
            <div className="absolute bottom-0 left-14 h-36 w-20 -rotate-[5deg] rounded-l-md rounded-r-sm border-l-4 border-sky-200/70 bg-gradient-to-br from-indigo-700 to-sky-500 shadow-xl" />
            <div className="absolute bottom-2 right-4 h-32 w-20 rotate-[11deg] rounded-l-md rounded-r-sm border-l-4 border-emerald-100/70 bg-gradient-to-br from-emerald-700 to-teal-400 shadow-xl" />
            <BookOpen className="relative z-10 mb-3 text-white/75" size={30} />
          </div>
        </div>
      </header>

      <div className={`relative rounded-[28px] border p-4 shadow-sm sm:p-6 ${isDarkMode ? "border-[#383832] bg-[#22221F]/95" : "border-white/80 bg-white/95"}`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? "text-sky-300" : "text-sky-700"}`}>Build your collection</p>
            <h3 className={`mt-1 text-lg font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>Add a book to your shelf</h3>
          </div>
          <span className={`text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Your personal books stay saved in this browser</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <form onSubmit={handleSaveGoogleBook} className={`rounded-2xl border p-4 sm:p-5 ${isDarkMode ? "border-[#45453B] bg-[#292925]" : "border-slate-200 bg-gradient-to-br from-white to-sky-50/60"}`}>
            <label htmlFor="library-book-url" className={`mb-2 block text-xs font-bold ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"}`}>
              Add from a book link
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <ExternalLink size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  id="library-book-url"
                  type="url"
                  required
                  placeholder="Google Books link or direct PDF URL"
                  value={bookLinkUrl}
                  onChange={(event) => setBookLinkUrl(event.target.value)}
                  className={`w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition-shadow focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 ${isDarkMode ? "border-[#45453B] bg-[#22221F] text-[#E0E0D5] placeholder:text-[#77776D]" : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"}`}
                />
              </div>
              <button type="submit" disabled={isSavingBook} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-800 hover:shadow-md disabled:cursor-wait disabled:opacity-60">
                {isSavingBook ? <Loader2 size={15} className="animate-spin" /> : <BookMarked size={15} />}
                Save link
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Google Books and direct PDF links are welcome.</p>
              <label className={`shrink-0 text-[11px] font-semibold ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>
                Subject
                <select value={newBookDepartment} onChange={(event) => setNewBookDepartment(event.target.value)} className={`ml-2 rounded-lg border px-3 py-2 text-xs outline-none focus:border-sky-500 ${isDarkMode ? "border-[#45453B] bg-[#22221F] text-[#E0E0D5]" : "border-slate-200 bg-white text-slate-800"}`}>
                  {departments.filter((department) => department !== "All").map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
              </label>
            </div>
          </form>

          <div className={`flex flex-col justify-between gap-4 rounded-2xl border border-dashed p-4 sm:flex-row sm:items-center sm:p-5 xl:flex-col xl:items-start ${isDarkMode ? "border-sky-900/70 bg-sky-950/20" : "border-sky-200 bg-sky-50/65"}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDarkMode ? "bg-sky-500/15 text-sky-300" : "bg-white text-sky-700 shadow-sm"}`}><FileUp size={21} /></span>
              <span>
                <span className={`block text-sm font-bold ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-800"}`}>Have a PDF on your computer?</span>
                <span className={`mt-1 block text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Keep it on this device and add a cover to your shelf.</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0 xl:w-full">
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleLocalBookPick} />
              <button type="button" disabled={isSavingBook} onClick={() => fileInputRef.current?.click()} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 ${isDarkMode ? "border-[#55554B] bg-[#22221F] text-[#E0E0D5] hover:bg-[#383832]" : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-800"}`}>
                {isSavingBook ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
                Add PDF from device
              </button>
            </div>
          </div>
        </div>
        <p className={`mt-3 text-[11px] ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Selecting Study Book uploads a PDF for processing. Web links save their source URL and book details.</p>
        {saveError && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{saveError}</motion.p>}
        {saveMessage && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{saveMessage}</motion.p>}

        <div className={`my-6 h-px ${isDarkMode ? "bg-[#383832]" : "bg-slate-100"}`} />

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search size={17} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#A1A194]" : "text-slate-400"}`} />
            <input
              type="search"
              placeholder="Search by title, author, or topic..."
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className={`w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm outline-none transition-shadow focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 ${isDarkMode ? "border-[#45453B] bg-[#292925] text-[#E0E0D5] placeholder:text-[#77776D]" : "border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400"}`}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {departments.map((department) => (
              <motion.button
                key={department}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onDepartmentChange(department)}
                aria-pressed={selectedDepartment === department}
                className={`relative shrink-0 overflow-hidden rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  selectedDepartment === department
                    ? "border-sky-700 text-white"
                    : isDarkMode
                      ? "border-[#45453B] text-[#C2C2B0] hover:bg-[#383832]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                }`}
              >
                {selectedDepartment === department && <motion.span layoutId="library-filter-pill" className="absolute inset-0 rounded-full bg-sky-700" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                <span className="relative z-10">{department}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mb-3 mt-7 flex items-center justify-between gap-3">
          <div>
            <h3 className={`font-serif text-xl font-bold ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>{selectedDepartment === "All" ? "Explore the shelves" : `${selectedDepartment} collection`}</h3>
            <p className={`mt-1 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>{filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} to discover</p>
          </div>
          <BookOpen size={20} className={isDarkMode ? "text-sky-300/70" : "text-sky-700/55"} />
        </div>

        {filteredBooks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 rounded-2xl border border-dashed p-10 text-center ${isDarkMode ? "border-[#45453B] bg-[#292925]" : "border-slate-200 bg-slate-50/60"}`}>
            <BookOpen className={`mx-auto mb-3 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} size={30} />
            <p className={`text-sm font-semibold ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"}`}>No books found on this shelf</p>
            <p className={`mt-1 text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>Try another search, or add a book of your own above.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book, index) => {
                const isSelected = selectedFileUri === (book.fileUri || book.id);
                const isBusy = busyBookId === book.id;
                return (
                  <motion.article
                    key={book.id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.25), layout: { type: "spring", stiffness: 320, damping: 28 } }}
                    whileHover={{ y: -5, transition: { duration: 0.18 } }}
                    className={`flex min-w-0 flex-col rounded-[22px] border p-3 shadow-sm transition-shadow hover:shadow-xl ${
                      isSelected
                        ? isDarkMode ? "border-sky-500 bg-sky-950/25 shadow-sky-950/30" : "border-sky-300 bg-sky-50/70 shadow-sky-100"
                        : isDarkMode ? "border-[#45453B] bg-[#292925] hover:border-sky-800/70" : "border-slate-200/90 bg-white hover:border-sky-200"
                    }`}
                  >
                    <BookCover book={book} onClick={() => setPreviewBook(book)} />
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
                      <div className="flex min-h-6 items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${isDarkMode ? "bg-indigo-950/70 text-indigo-200" : "bg-indigo-50 text-indigo-700"}`}>{book.department}</span>
                        <span className="flex items-center gap-1.5">
                          {book.storageType && <span className={`text-[10px] font-medium ${isDarkMode ? "text-[#A1A194]" : "text-slate-400"}`}>{book.storageType === "file" ? "On this device" : "Book link"}</span>}
                          {book.storageType && <button type="button" onClick={() => void handleRemoveBook(book)} aria-label={`Remove ${book.title} from your library`} title="Remove from library" className={`rounded-md p-1 transition-colors ${isDarkMode ? "text-[#A1A194] hover:bg-red-950/40 hover:text-red-300" : "text-slate-400 hover:bg-red-50 hover:text-red-600"}`}><Trash2 size={14} /></button>}
                        </span>
                      </div>
                      <h4 className={`mt-3 line-clamp-2 min-h-10 text-sm font-bold leading-snug ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-800"}`}>{book.title}</h4>
                      <p className={`mt-1 truncate text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>By {book.author}</p>
                      <p className={`mt-3 line-clamp-3 min-h-[3.4rem] text-xs leading-relaxed ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>{book.desc || "A book waiting to be explored."}</p>
                      <div className="mt-auto flex items-center gap-2 pt-4">
                        <button type="button" onClick={() => studyBook(book)} disabled={isBusy} className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all disabled:cursor-wait disabled:opacity-60 ${isSelected ? "bg-sky-700 text-white shadow-sm" : isDarkMode ? "border border-sky-500/80 text-sky-300 hover:bg-sky-950/50" : "border border-sky-700 text-sky-700 hover:bg-sky-50"}`}>
                          {isBusy ? <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Preparing...</span> : isSelected ? "Selected for Study" : "Study Book"}
                        </button>
                        <button type="button" onClick={() => setPreviewBook(book)} aria-label={`Preview ${book.title}`} title="Preview book" className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${isDarkMode ? "border-[#55554B] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 text-slate-500 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"}`}><BookOpen size={16} /></button>
                        {book.sourceUrl && <a href={book.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${book.title} source link`} title="Open source link" className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${isDarkMode ? "border-[#55554B] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 text-slate-500 hover:bg-sky-50 hover:text-sky-700"}`}><ExternalLink size={15} /></a>}
                        <button type="button" onClick={() => void handleDownloadBook(book)} aria-label={book.storageType === "file" ? `Download ${book.title}` : `Download study companion for ${book.title}`} title={book.storageType === "file" ? "Download original book" : "Download study companion"} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${isDarkMode ? "border-[#55554B] text-[#C2C2B0] hover:bg-[#383832]" : "border-slate-200 text-slate-500 hover:bg-sky-50 hover:text-sky-700"}`}><Download size={15} /></button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {previewBook && (
          <motion.div
            key="book-preview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && setPreviewBook(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="library-book-preview-title"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={`relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border p-4 shadow-2xl sm:p-7 ${isDarkMode ? "border-[#45453B] bg-[#22221F] text-[#E0E0D5]" : "border-white bg-[#fbfdff] text-slate-800"}`}
            >
              <button type="button" onClick={() => setPreviewBook(null)} aria-label="Close book preview" className={`absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-colors sm:right-6 sm:top-6 ${isDarkMode ? "border-white/10 bg-black/20 text-white hover:bg-white/10" : "border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-100"}`}><X size={18} /></button>
              <div className="grid gap-6 pt-8 sm:gap-8 md:grid-cols-[minmax(220px,0.78fr)_1.22fr] md:pt-2">
                <div className="mx-auto w-full max-w-[330px]">
                  <BookCover book={previewBook} large />
                  <p className={`mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] ${isDarkMode ? "text-[#A1A194]" : "text-slate-400"}`}>Cover preview • Notivexa reader's edition</p>
                </div>
                <div className="flex flex-col py-2 md:py-5">
                  <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${isDarkMode ? "bg-sky-950/60 text-sky-200" : "bg-sky-50 text-sky-800"}`}>{previewBook.department} collection</span>
                  <h2 id="library-book-preview-title" className={`mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>{previewBook.title}</h2>
                  <p className={`mt-2 text-sm ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>By {previewBook.author}</p>
                  <div className={`my-6 h-px ${isDarkMode ? "bg-[#383832]" : "bg-slate-200"}`} />
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300"><BookOpen size={15} /> Book preview</div>
                  <p className={`mt-3 text-sm leading-7 ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>{previewBook.desc || "This title is ready to explore. Open the source link or use your study tools to get started."}</p>
                  <div className={`mt-5 rounded-2xl border p-4 ${isDarkMode ? "border-[#45453B] bg-[#292925]" : "border-slate-200 bg-slate-50/80"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${isDarkMode ? "text-[#A1A194]" : "text-slate-400"}`}>In your library</p>
                    <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? "text-[#C2C2B0]" : "text-slate-600"}`}>{previewBook.storageType === "file" ? "PDF stored on this device" : previewBook.sourceUrl ? "Book link saved to your collection" : "Available in the Notivexa catalog"}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <button type="button" onClick={() => studyBook(previewBook)} disabled={busyBookId === previewBook.id} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-800 disabled:opacity-60">
                      {busyBookId === previewBook.id ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />} Study this book
                    </button>
                    {previewBook.sourceUrl && <a href={previewBook.sourceUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-colors ${isDarkMode ? "border-[#55554B] hover:bg-[#383832]" : "border-slate-200 bg-white hover:bg-slate-50"}`}><ExternalLink size={14} /> Open source</a>}
                    <button type="button" onClick={() => void handleDownloadBook(previewBook)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-colors ${isDarkMode ? "border-[#55554B] hover:bg-[#383832]" : "border-slate-200 bg-white hover:bg-slate-50"}`}><Download size={14} /> {previewBook.storageType === "file" ? "Download PDF" : "Study guide"}</button>
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
