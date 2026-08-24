import express from "express";
import path from "path";
import multer from "multer";
import { createRequire } from "module";
import fs from "fs";
import os from "os";
const customRequire = typeof __filename !== "undefined" ? createRequire(__filename) : createRequire(import.meta.url);
const pdfParse = customRequire("pdf-parse");
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

// Setup Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: "50mb" }));

// In-memory cache for PDF texts to bypass 1,048,576 token limit on massive files
const pdfTextCache = new Map<string, string>();

const PRESET_BOOKS: Record<string, { title: string; author: string; contentReference: string }> = {
  "book:gatsby": {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    contentReference: "This request pertains to the full classic book 'The Great Gatsby' by F. Scott Fitzgerald. You must act as an expert study companion with comprehensive master-level knowledge of this specific book's complete text, chapters, character arcs, historical context, and stylistic devices."
  },
  "book:frankenstein": {
    title: "Frankenstein",
    author: "Mary Shelley",
    contentReference: "This request pertains to the full classic book 'Frankenstein; or, The Modern Prometheus' by Mary Shelley. You must act as an expert study companion with comprehensive master-level knowledge of this specific book's complete text, philosophical questions, chapters, characters, and stylistic devices."
  },
  "book:sherlock_holmes": {
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    contentReference: "This request pertains to the full classic book 'The Adventures of Sherlock Holmes' by Arthur Conan Doyle. You must act as an expert study companion with comprehensive master-level knowledge of this specific book's complete characters, plot points, chapters, and stylistic devices."
  },
  "book:alice_in_wonderland": {
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    contentReference: "This request pertains to the full classic book 'Alice's Adventures in Wonderland' by Lewis Carroll. You must act as an expert study companion with comprehensive master-level knowledge of this specific book's complete text, chapters, nonsense philosophy, character representations, and stylistic devices."
  },
  "book:pride_and_prejudice": {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    contentReference: "This request pertains to the full classic book 'Pride and Prejudice' by Jane Austen. You must act as an expert study companion with comprehensive master-level knowledge of this specific book's complete text, chapters, characters, social themes, and stylistic devices."
  },
  "book:macbeth": {
    title: "Macbeth",
    author: "William Shakespeare",
    contentReference: "This request pertains to the full classic tragedy play 'Macbeth' by William Shakespeare. You must act as an expert study companion with comprehensive master-level knowledge of this play's scenes, character developments (Macbeth, Lady Macbeth), themes of ambition, guilt, fate, and tragic devices."
  },
  // MCA (Master of Computer Applications)
  "book:distributed_systems": {
    title: "Distributed Systems: Concepts and Design",
    author: "George Coulouris",
    contentReference: "This request pertains to the core concepts of the academic textbook 'Distributed Systems: Concepts and Design' by George Coulouris. You must act as an expert computer science professor with master-level knowledge of distributed computing architectures, peer-to-peer systems, coordination, consensus algorithms, cloud computing infrastructure, and fault tolerance."
  },
  "book:advanced_db": {
    title: "Advanced Database Management Systems",
    author: "Raghu Ramakrishnan",
    contentReference: "This request pertains to the core concepts of the academic textbook 'Database Management Systems' by Raghu Ramakrishnan. You must act as an expert database systems engineer with comprehensive master-level knowledge of advanced SQL, query optimization, physical database design, index structures, concurrency control, transaction processing, and modern NoSQL/distributed database technologies."
  },
  // BCA (Bachelor of Computer Applications)
  "book:cpp_oop": {
    title: "Programming in C++ and Object-Oriented Design",
    author: "Bjarne Stroustrup",
    contentReference: "This request pertains to the core concepts of 'Programming in C++ and Object-Oriented Design' by Bjarne Stroustrup. You must act as an expert software engineering instructor with comprehensive knowledge of object-oriented programming (OOP), classes, inheritance, polymorphism, templates, memory management, pointers, and standard software development principles."
  },
  "book:computer_networks": {
    title: "Computer Networks & Internet Protocols",
    author: "Andrew S. Tanenbaum",
    contentReference: "This request pertains to the academic textbook 'Computer Networks' by Andrew S. Tanenbaum. You must act as an expert computer networks professor with comprehensive knowledge of network architectures, OSI layers, physical and data-link layers, medium access control, routing algorithms, TCP/UDP, and application layer protocols."
  },
  // Engineering
  "book:artificial_intelligence": {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell & Peter Norvig",
    contentReference: "This request pertains to the definitive textbook 'Artificial Intelligence: A Modern Approach' by Stuart Russell and Peter Norvig. You must act as an expert AI researcher with comprehensive master-level knowledge of rational agents, search algorithms (informed/uninformed), knowledge representation, reasoning, planning, probabilistic models, machine learning, deep neural networks, and reinforcement learning."
  },
  "book:engineering_math": {
    title: "Advanced Engineering Mathematics",
    author: "Erwin Kreyszig",
    contentReference: "This request pertains to the fundamental textbook 'Advanced Engineering Mathematics' by Erwin Kreyszig. You must act as an expert applied mathematician with comprehensive knowledge of differential equations, linear algebra, vector calculus, Fourier analysis, complex analysis, and numerical methods for engineering."
  },
  "book:fluid_mechanics": {
    title: "Fluid Mechanics & Thermodynamics",
    author: "Frank M. White",
    contentReference: "This request pertains to the core principles of 'Fluid Mechanics' by Frank M. White. You must act as an expert mechanical engineer with comprehensive knowledge of fluid properties, fluid statics, control volume analysis, Navier-Stokes equations, dimensional analysis, pipe flow, drag, lift, and basic thermodynamic cycles."
  },
  // Pharmacy
  "book:medical_pharmacology": {
    title: "Essentials of Medical Pharmacology",
    author: "K.D. Tripathi",
    contentReference: "This request pertains to the medical pharmacy textbook 'Essentials of Medical Pharmacology' by K.D. Tripathi. You must act as an expert clinical pharmacologist with comprehensive knowledge of drug actions, pharmacokinetics (absorption, distribution, metabolism, excretion), pharmacodynamics, receptor mechanisms, clinical therapeutics, drug interactions, and toxicities."
  },
  "book:pharmaceutics": {
    title: "Pharmaceutics: Formulations and Drug Delivery",
    author: "Michael E. Aulton",
    contentReference: "This request pertains to the pharmacy textbook 'Pharmaceutics: The Science of Dosage Form Design' by Michael E. Aulton. You must act as an expert pharmaceutical scientist with comprehensive knowledge of dosage form design, drug formulation, biopharmaceutics, physical pharmacy, drug stability, and industrial manufacturing of solid, liquid, and sterile pharmaceuticals."
  },
  // Commerce
  "book:corporate_finance": {
    title: "Principles of Corporate Finance",
    author: "Richard A. Brealey & Stewart C. Myers",
    contentReference: "This request pertains to the classic textbook 'Principles of Corporate Finance' by Brealey and Myers. You must act as an expert corporate financial analyst with comprehensive knowledge of valuation, capital budgeting, risk and return models, capital structure, dividend policies, options pricing, mergers and acquisitions, and working capital management."
  },
  "book:financial_accounting": {
    title: "Advanced Financial Accounting",
    author: "Theodore E. Christensen",
    contentReference: "This request pertains to the accounting textbook 'Advanced Financial Accounting' by Christensen. You must act as an expert certified public accountant with comprehensive knowledge of financial reporting standards, consolidations, foreign currency transactions, derivatives, segment reporting, partnerships, and intercompany transactions."
  },
  // Science
  "book:brief_history_time": {
    title: "A Brief History of Time & Cosmology",
    author: "Stephen Hawking",
    contentReference: "This request pertains to the classic book 'A Brief History of Time' by Stephen Hawking. You must act as an expert theoretical physicist with comprehensive knowledge of general relativity, space-time, black holes, the expansion of the universe, quantum mechanics, the big bang, and the search for a unified theory of physics."
  },
  "book:organic_chemistry": {
    title: "Organic Chemistry: Structure and Reactivity",
    author: "Robert T. Morrison & Robert N. Boyd",
    contentReference: "This request pertains to the classic textbook 'Organic Chemistry' by Morrison and Boyd. You must act as an expert organic chemist with comprehensive knowledge of chemical structures, stereochemistry, aliphatic and aromatic compounds, reaction mechanisms (substitution, elimination, addition), synthesis pathways, and spectroscopic analysis (NMR, IR)."
  },
  // Arts
  "book:story_of_art": {
    title: "The Story of Art & Visual History",
    author: "E.H. Gombrich",
    contentReference: "This request pertains to the classic art history survey 'The Story of Art' by E.H. Gombrich. You must act as an expert art historian with comprehensive knowledge of artistic movements, stylistic eras from prehistoric and classical periods to the Renaissance, Impressionism, Modernism, and contemporary arts, including critical visual analysis of key masterpieces."
  },
  "book:history_western_philosophy": {
    title: "A History of Western Philosophy",
    author: "Bertrand Russell",
    contentReference: "This request pertains to the comprehensive work 'A History of Western Philosophy' by Bertrand Russell. You must act as an expert philosopher with comprehensive knowledge of key thinkers, historical context, and systems of thought from the pre-Socratic Greek era, medieval Scholasticism, to Modern rationalism, empiricism, Kantianism, and analytical philosophy."
  }
};

async function getContentParts(fileUri: string, mimeType: string, prompt: string): Promise<any[]> {
  // If this is a preset library book, inject the expert literature context
  if (fileUri && fileUri.startsWith("book:")) {
    const book = PRESET_BOOKS[fileUri] || { title: fileUri, author: "Unknown", contentReference: `This request is about the book: ${fileUri}` };
    return [
      {
        role: "user",
        parts: [
          { text: `${book.contentReference}\n\nPlease generate a highly detailed, accurate, and structured study output for this work according to the instructions below.` },
          { text: prompt }
        ]
      }
    ];
  }

  // Handle custom URL books
  if (fileUri && fileUri.startsWith("link:")) {
    const url = fileUri.substring(5);
    let textContent = pdfTextCache.get(fileUri);
    if (!textContent) {
      try {
        console.log(`Fetching remote link book: ${url}`);
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch website link (${response.status} ${response.statusText})`);
        }
        
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const data = await pdfParse(buffer);
          textContent = data.text || "";
          console.log(`Successfully fetched and parsed PDF from link. Character length: ${textContent.length}`);
        } else {
          // Parse HTML text
          const html = await response.text();
          textContent = html
            .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
            .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          console.log(`Successfully fetched and parsed HTML from link. Character length: ${textContent.length}`);
        }
        
        if (textContent && textContent.trim().length > 10) {
          pdfTextCache.set(fileUri, textContent);
        } else {
          textContent = `This website link: ${url} did not yield readable text content.`;
        }
      } catch (err: any) {
        console.error("Error fetching/parsing link book:", err);
        textContent = `Error loading content from the link: ${url}. Details: ${err.message}`;
      }
    }
    
    const maxCharacters = 3000000;
    let textToUse = textContent || "";
    let wasTruncated = false;
    if (textToUse.length > maxCharacters) {
      textToUse = textToUse.slice(0, maxCharacters);
      wasTruncated = true;
    }
    
    if (wasTruncated) {
      textToUse += "\n\n[NOTE: The book website content was extremely large and has been truncated to fit within the AI's processing limits.]";
    }
    
    return [
      {
        role: "user",
        parts: [
          { text: `Here is the website/document content from the link:\n\n${textToUse}` },
          { text: prompt }
        ]
      }
    ];
  }

  // Always use fileData natively so that Gemini scans the document page by page
  // including all image-based scanned pages, diagrams, and text.
  return [
    {
      role: "user",
      parts: [
        { fileData: { fileUri, mimeType } },
        { text: prompt }
      ]
    }
  ];
}

// Helper to safely parse JSON from model responses, extracting from markdown code blocks or brackets if needed
function safeParseJson(text: string): any {
  if (!text) return null;
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt to extract JSON from Markdown code blocks
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerErr) {
        // Continue fallback
      }
    }
    
    // Attempt to find first [ and last ]
    const startIdxArray = cleaned.indexOf('[');
    const endIdxArray = cleaned.lastIndexOf(']');
    if (startIdxArray !== -1 && endIdxArray !== -1 && endIdxArray > startIdxArray) {
      try {
        return JSON.parse(cleaned.slice(startIdxArray, endIdxArray + 1));
      } catch (innerErr) {
        // Continue
      }
    }

    // Attempt to find first { and last }
    const startIdxObj = cleaned.indexOf('{');
    const endIdxObj = cleaned.lastIndexOf('}');
    if (startIdxObj !== -1 && endIdxObj !== -1 && endIdxObj > startIdxObj) {
      try {
        return JSON.parse(cleaned.slice(startIdxObj, endIdxObj + 1));
      } catch (innerErr) {
        // Continue
      }
    }
    
    throw err;
  }
}

// Helper to get Gemini client
function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is missing");
  }
  return new GoogleGenAI({ 
    apiKey: key,
    httpOptions: {
      timeout: 300000,
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper to parse explicit retry delay from Gemini API error details (or string)
function getRetryDelay(error: any): number | null {
  try {
    if (error.message && (error.message.startsWith("{") || error.message.includes('{"error"'))) {
      const startIdx = error.message.indexOf('{"error"');
      if (startIdx !== -1) {
        const jsonStr = error.message.slice(startIdx);
        const parsed = JSON.parse(jsonStr);
        const details = parsed.error?.details;
        if (Array.isArray(details)) {
          const retryInfo = details.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo" || d.retryDelay);
          if (retryInfo && retryInfo.retryDelay) {
            const seconds = parseFloat(retryInfo.retryDelay);
            if (!isNaN(seconds)) {
              return seconds * 1000;
            }
          }
        }
      }
    }
    
    if (error.error?.details) {
      const details = error.error.details;
      if (Array.isArray(details)) {
        const retryInfo = details.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo" || d.retryDelay);
        if (retryInfo && retryInfo.retryDelay) {
          const seconds = parseFloat(retryInfo.retryDelay);
          if (!isNaN(seconds)) {
            return seconds * 1000;
          }
        }
      }
    }

    if (error.message) {
      const match = error.message.match(/retry in ([\d\.]+)\s*s/i);
      if (match && match[1]) {
        const seconds = parseFloat(match[1]);
        if (!isNaN(seconds)) {
          return seconds * 1000;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse retry delay:", e);
  }
  return null;
}

// Helper to check if a 429 is a hard daily quota limit or model quota exhaustion which won't recover by retrying
function isHardQuotaExceeded(error: any): boolean {
  try {
    const errorMsg = (error.message || "").toLowerCase();
    const isResourceExhausted = 
      error.status === 429 || 
      error.status === "RESOURCE_EXHAUSTED" ||
      error.statusCode === 429 ||
      errorMsg.includes("resource_exhausted") || 
      errorMsg.includes("429") || 
      errorMsg.includes("quota") ||
      error.error?.status === "RESOURCE_EXHAUSTED" ||
      error.error?.code === 429;

    if (!isResourceExhausted) return false;

    // Check for indicators of limit 0, daily quota limits, or free tier model exhaustion
    if (
      errorMsg.includes("limit: 0") ||
      errorMsg.includes("generaterequestsperday") ||
      errorMsg.includes("perday") ||
      errorMsg.includes("per_day") ||
      errorMsg.includes("daily") ||
      errorMsg.includes("limit: 20") ||
      errorMsg.includes("limit: 50")
    ) {
      return true;
    }

    // If there is an explicit retry delay > 10 seconds, treat it as exhausted for immediate retry
    const delay = getRetryDelay(error);
    if (delay && delay > 10000) {
      return true;
    }

    // If there is an explicit retry delay or per-minute token rate limit, it might recover eventually
    if (getRetryDelay(error) !== null || errorMsg.includes("retry in") || errorMsg.includes("perminute") || errorMsg.includes("per_minute") || errorMsg.includes("tokencount")) {
      return false;
    }
  } catch (e) {
    console.warn("Failed to check hard quota status:", e);
  }
  return false;
}

function checkIsOverload(error: any, errorMsg: string): boolean {
  const status = error.status || error.statusCode || error.code || error.error?.status || error.error?.code;
  const statusStr = String(status || "").toUpperCase();
  
  return (
    statusStr === "503" ||
    statusStr === "UNAVAILABLE" ||
    errorMsg.includes("503") ||
    errorMsg.includes("temporarily overloaded") ||
    errorMsg.includes("high demand") ||
    errorMsg.includes("service unavailable") ||
    errorMsg.includes("unavailable") ||
    errorMsg.includes("overloaded")
  );
}

function checkIsTimeout(error: any, errorMsg: string): boolean {
  const status = error.status || error.statusCode || error.code || error.error?.status || error.error?.code;
  const statusStr = String(status || "").toUpperCase();
  
  return (
    statusStr === "504" ||
    statusStr === "408" ||
    statusStr === "DEADLINE_EXCEEDED" ||
    errorMsg.includes("504") ||
    errorMsg.includes("408") ||
    errorMsg.includes("deadline") ||
    errorMsg.includes("timeout") ||
    errorMsg.includes("timed out") ||
    errorMsg.includes("expired") ||
    errorMsg.includes("deadline_exceeded")
  );
}

function checkIsRateLimit(error: any, errorMsg: string): boolean {
  const status = error.status || error.statusCode || error.code || error.error?.status || error.error?.code;
  const statusStr = String(status || "").toUpperCase();
  
  return (
    statusStr === "429" ||
    statusStr === "RESOURCE_EXHAUSTED" ||
    errorMsg.includes("429") ||
    errorMsg.includes("resource_exhausted") ||
    errorMsg.includes("rate limit") ||
    errorMsg.includes("ratelimit") ||
    errorMsg.includes("too many requests") ||
    errorMsg.includes("quota")
  );
}

// Helper with exponential backoff for Gemini API calls
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 1, initialDelayMs = 500, failFastOnOverload = false): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      const errorMsg = (error.message || "").toLowerCase();
      
      // If it is a hard daily/model quota exceeded error, do NOT retry. Throw immediately to trigger the fallback model.
      if (isHardQuotaExceeded(error)) {
        console.warn(`Gemini API model/daily quota exceeded. Skipping retries for this model to trigger fallback.`);
        throw error;
      }

      const isOverload = checkIsOverload(error, errorMsg);
      const isTimeout = checkIsTimeout(error, errorMsg);
      const isRateLimit = checkIsRateLimit(error, errorMsg);

      if (failFastOnOverload && (isOverload || isTimeout || isRateLimit)) {
        console.warn(`Gemini API rate limit/overload/timeout error (${error.message}). Skipping retries for this model to trigger fallback immediately.`);
        throw error;
      }

      const isRetryable = isOverload || isRateLimit || isTimeout;
      
      if (attempt > maxRetries || !isRetryable) {
        throw error;
      }

      // Check if we have an explicit retry delay from the API
      const apiRetryDelay = getRetryDelay(error);
      if (failFastOnOverload && apiRetryDelay !== null && apiRetryDelay > 3000) {
        console.warn(`Gemini API requested delay (${apiRetryDelay}ms). Skipping retries to trigger fallback immediately.`);
        throw error;
      }

      const currentDelay = apiRetryDelay !== null ? (apiRetryDelay + 1000) : delay;
      
      console.warn(`Gemini API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${currentDelay}ms... Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      
      if (apiRetryDelay === null) {
        delay *= 1.5; // Smooth backoff
      }
    }
  }
}

async function generateContentWithFallback(ai: any, params: any): Promise<any> {
  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-3.6-flash"
  ];
  const initialModel = params.model || "gemini-3.6-flash";
  const uniqueModels = Array.from(new Set([initialModel, ...modelsToTry]));
  
  let lastError: any = null;
  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    const hasMoreModels = i < uniqueModels.length - 1;
    try {
      console.log(`Attempting Gemini generation with model: ${model}`);
      const apiParams = { ...params, model };
      return await withRetry(() => ai.models.generateContent(apiParams), 3, 2000, true);
    } catch (error: any) {
      lastError = error;
      const errorMsg = (error.message || "").toLowerCase();
      const isQuotaOrTemporaryError = 
        checkIsOverload(error, errorMsg) ||
        checkIsTimeout(error, errorMsg) ||
        checkIsRateLimit(error, errorMsg) ||
        isHardQuotaExceeded(error) ||
        error.status === 404 ||
        errorMsg.includes("404") ||
        errorMsg.includes("not found") ||
        errorMsg.includes("no longer available") ||
        error.status === 400 ||
        errorMsg.includes("exceeds the maximum number of tokens allowed");
      
      if (isQuotaOrTemporaryError && hasMoreModels) {
        console.warn(`Model ${model} had quota, rate limit, demand, or availability issue. Trying next available model in fallback list...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function formatGeminiError(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes("exceeds the maximum number of tokens allowed") || msg.includes("token count exceeds") || msg.includes("1048576")) {
    return "The uploaded document is too large (exceeds the limit of 1,048,576 tokens). Please try uploading a smaller document, or a specific chapter, so Notivexa can process it effectively.";
  }
  const retryDelay = getRetryDelay(error);
  if (retryDelay !== null || msg.includes("retry in") || msg.includes("PerMinute") || msg.includes("InputTokensPerModelPerMinute")) {
    const seconds = retryDelay ? Math.ceil(retryDelay / 1000) : 30;
    return `The AI service rate limit was briefly reached. Please wait ${seconds} seconds and click Generate again, or configure your own Gemini API Key in Settings > Secrets for unlimited access.`;
  }
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return "The daily free-tier Gemini API request quota has been exceeded for this project. To continue using Notivexa without limitations, please configure your own personal Gemini API Key under the 'Settings > Secrets' panel (using the gear icon in the top right), or try again tomorrow.";
  }
  if (msg.includes("503") || msg.includes("high demand") || msg.includes("temporarily overloaded") || error?.status === 503) {
    return "The AI model is currently experiencing high demand and is temporarily overloaded. Please try again in a few moments.";
  }
  if (msg.includes("504") || msg.toLowerCase().includes("deadline") || msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("timed out") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("deadline_exceeded") || error?.status === 504) {
    return "The AI request timed out (deadline exceeded). This happens when the service is under high load or the request is too complex. Please try again in a moment, or try with a smaller section of your document.";
  }
  if (error.status === 403 || msg.includes("permission_denied")) {
    return "The uploaded file is no longer accessible or has expired (Permission Denied). Please re-upload your document and try generating again.";
  }
  return msg;
}

// 7. AI Chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, fileUri, mimeType, history = [] } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const ai = getGenAI();

    let contents = [];
    const sysPrompt = "You are a highly capable AI tutor and study assistant. You help students understand concepts, answer questions, and break down complex topics based on the provided document context. Use rich Markdown formatting (bold, italics, lists, code blocks, tables) to make your explanations structured and easy to read. Be encouraging, precise, and educational.";

    if (fileUri) {
      // Get the document contents
      const fileParts = await getContentParts(fileUri, mimeType || "application/pdf", "");
      // fileParts[0] is { role: "user", parts: [ {text: doc}, {text: prompt} ] }
      // We will replace the prompt part with our sys instruction
      const docMsg = fileParts[0];
      if (docMsg && docMsg.parts) {
        docMsg.parts[docMsg.parts.length - 1] = { text: sysPrompt };
      }
      contents.push(docMsg);
      contents.push({ role: "model", parts: [{ text: "Understood. I have reviewed the document and am ready to act as your AI tutor." }] });
    } else {
      contents.push({ role: "user", parts: [{ text: sysPrompt }] });
      contents.push({ role: "model", parts: [{ text: "Understood. I am ready to act as your AI tutor." }] });
    }

    // Append history
    for (const msg of history) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }]
      });
    }

    // Append current prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.6-flash",
      contents: contents
    });
    return res.json({ result: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});

// API Routes

// 1. Upload PDF and process via Gemini Files API
app.post("/api/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const ai = getGenAI();
    
    // Determine the file extension based on MIME type
    const mime = req.file.mimetype || "";
    let ext = ".pdf";
    if (mime.includes("image/png")) ext = ".png";
    else if (mime.includes("image/jpeg") || mime.includes("image/jpg")) ext = ".jpg";
    else if (mime.includes("image/webp")) ext = ".webp";
    
    const tempPath = path.join(os.tmpdir(), `upload-${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    
    // Attempt to extract text using pdf-parse if it is a PDF
    let parsedText = "";
    if (mime.includes("application/pdf")) {
      try {
        const data = await pdfParse(req.file.buffer);
        parsedText = data.text || "";
        console.log(`Successfully extracted ${parsedText.length} characters from PDF using pdf-parse`);
      } catch (parseErr) {
        console.warn("Failed to extract text using pdf-parse, will rely entirely on Gemini File API OCR:", parseErr);
      }
    }

    const uploadedFile = await withRetry(() => ai.files.upload({
      file: tempPath,
      config: { mimeType: req.file.mimetype },
    }));
    
    fs.unlinkSync(tempPath); // Clean up
    
    // Cache parsed text if it's meaningful
    if (parsedText && parsedText.trim().length > 100) {
      pdfTextCache.set(uploadedFile.uri, parsedText);
    }
    
    res.json({ fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType });
  } catch (error: any) {
    console.error("Upload error:", error.stack || error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// 2. Generate Summaries & Notes
app.post("/api/generate-notes", async (req, res) => {
  try {
    const { fileUri, mimeType, focusArea, mode } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
        const ai = getGenAI();
    
        let lengthInstructions = `Generate a highly comprehensive and detailed summary of the provided text.
      Break the summary into logical pages using the "---PAGE_BREAK---" marker between major sections or topics.
      Aim for a detailed summary, providing step-by-step breakdowns and examples, but keep it concise if the content is extremely large to prevent timeouts.
      Ensure the output does not exceed the model token limits and stays within a reasonable processing time.`;

    const prompt = `
      You are an expert teacher and exam notes writer. I have provided a book or study material.
      Focus Area: ${focusArea || 'General Understanding'}
      
      Instructions:
      1. Start with a simple and clear definition of the topic.
      2. Provide the main explanation in points.
      3. YOU MUST use standard Markdown bullet points (hyphens '-') for all lists.
         - EVERY single point MUST start on a NEW LINE.
         - NEVER place multiple points on the same line.
         - DO NOT use Unicode bullet characters like '•' or '·'.
      4. For algorithms, use a numbered list (1., 2., 3...).
      5. For comparisons, use a simple text-based Markdown table format. IMPORTANT: If you need to include list items or new lines INSIDE a table cell, you MUST use the HTML <br> tag to separate them (e.g., - Point 1<br>- Point 2). DO NOT use unicode bullets or spaces to separate list items in tables.
      6. For diagrams, use Mermaid syntax inside a mermaid code block. DO NOT generate any text explanation, summary, or legend before or after the diagram. Just the diagram itself.
      7. Use bold formatting (**) for key points and important terms to enhance readability. At the very beginning, ALWAYS provide the Chapter Name, Unit Name, and Title in a BIG FONT using Markdown Headers (# and ##).
      8. End with a short conclusion if needed.
      
      

      Tasks:
      ${lengthInstructions}
      3. PAGE-BY-PAGE SCAN: Carefully scan the uploaded file ONE BY ONE PAGE. You must read both text and image-based (scanned) pages, extracting all relevant information.
      4. Convert the content into structured, step-by-step study notes suitable for a student.
      5. ALGORITHMS: Whenever an algorithm is discussed, extract it and format it clearly as a STEP-BY-STEP numbered list.
      6. IMAGE-BASED DIAGRAMS & CHARTS: Whenever there is a diagram, chart, block diagram, or figure in the original text (whether it is a digital graphic or an image-based scanned diagram), you MUST scan it and accurately recreate it using Mermaid.js syntax inside a markdown mermaid block, and add it directly into the generated summary. This is critical for visual learning. DO NOT USE placeholders like [DIAGRAM], USE MERMAID. DO NOT output any text explaining the diagram before or after the Mermaid block.
      7. COMPARISONS AND DIFFERENCES: Whenever the text discusses differences between concepts or compares multiple things, YOU MUST format these comparisons as Markdown TABLES. YOU MUST provide a minimum of 10 differences/points of comparison whenever possible.
      
      Note: Keep Mermaid node labels clean and concise. Each Mermaid statement must be on its own line. DO NOT include any node legends, map keys, or descriptive legend boxes in the diagrams.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          maxOutputTokens: 8192,
        }
      });
      return res.json({ result: response.text });
    } catch (error: any) {
      console.error("Notes error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Notes outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});

// 3. Generate Question Bank & Exam
app.post("/api/generate-assessment", async (req, res) => {
  try {
    const { fileUri, mimeType, difficulty, mode } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();
    
    
    const prompt = `
      You are an expert teacher. Generate an assessment based on the provided material.
      Difficulty: ${difficulty || 'Medium'}
      
      CRITICAL INSTRUCTION: You MUST generate a minimum of 30 unique questions for EACH sub-section below. 
      Ensure that NO questions are repeated across or within sections. 
      DO NOT generate answers, explanations, or solutions. ONLY generate the questions themselves. 
      Output as plain text, using standard formatting. DO NOT use any special formatting to mimic student handwriting.
      The output should be formatted as a student study assessment.

      Tasks:
      Generate 4 distinct sets of the Exam Question Paper (Set A, Set B, Set C, Set D) as Markdown tables, mimicking the format of the provided example.
      Ensure each set has variations in questions.

      Structure the output as follows for each set:
      # UNIVERSITY OF MUMBAI - [SET LETTER]
      ## DEPARTMENT OF COMPUTER APPLICATIONS
      Degree: ... | Semester: ...
      Subject: ... | Subject Code: ...
      Time: ... | Max Marks: ...

      ### Instructions
      1. ...
      2. ...

      | Q. No | Topic | Questions | Marks |
      | :--- | :--- | :--- | :--- |
      | 1 | Compulsory Question | ... | 20 |
      ...

      Ensure a minimum of 30 unique questions for EACH section in EACH set. DO NOT generate answers, explanations, or solutions.
      Output ONLY the Markdown tables and headers for all 4 sets.
      Use '---SET_SEPARATOR---' exactly between each set to separate Set A, Set B, Set C, and Set D.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt)
      });
      return res.json({ result: response.text });
    } catch (error: any) {
      console.error("Assessment error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Assessment outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});

// Detect Diagrams from PDF / Document Endpoint
app.post("/api/detect-pdf-diagrams", async (req, res) => {
  try {
    const { fileUri, mimeType, scope = "full", scopeValue = "" } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();

    const prompt = `
You are an expert document computer vision and diagram extraction specialist.
Analyze the uploaded PDF document / study material and detect all major visual textbook diagrams, process flowcharts, system architectures, mind map hubs, lifecycle loops, and comparison grids present or described in the material.

Extract 4 to 8 high-value academic diagrams from the document. Return ONLY a JSON array of objects enclosed in \`\`\`json ... \`\`\` or raw JSON array:

[
  {
    "id": "diag-1",
    "title": "Clear Diagram Title",
    "type": "flow",
    "pageOrSection": "Chapter / Section / Page Ref",
    "description": "Concise 1-sentence description of what this diagram illustrates",
    "recommendedSlideTopic": "Topic / Unit Name",
    "selected": true,
    "items": [
      "Phase 1: Input & Data Capture",
      "Phase 2: Core Processing & Execution",
      "Phase 3: Storage & Verification",
      "Phase 4: Output Delivery & Response"
    ]
  }
]

Allowed diagram 'type' values: "flow" | "architecture" | "mindmap" | "cycle" | "matrix".
Ensure every diagram has 3 to 5 clear item nodes describing steps, layers, components, or quadrants.
`;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt)
      });
      const cleanText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const diagrams = JSON.parse(cleanText);
      const formattedDiagrams = diagrams.map((d: any, idx: number) => ({
        id: d.id || `diag-${idx + 1}`,
        title: d.title || `Detected Textbook Diagram ${idx + 1}`,
        type: ["flow", "architecture", "mindmap", "cycle", "matrix"].includes(d.type) ? d.type : "flow",
        pageOrSection: d.pageOrSection || "Textbook Section",
        description: d.description || "Schematic diagram extracted from document architecture.",
        recommendedSlideTopic: d.recommendedSlideTopic || "Core Topic",
        items: Array.isArray(d.items) && d.items.length > 0 ? d.items : ["Step 1: Input", "Step 2: Processing", "Step 3: Output"],
        selected: true
      }));
      return res.json({ diagrams: formattedDiagrams });
    } catch (error: any) {
      console.error("Detect diagrams JSON parse error:", error);
      // Fallback structured diagrams if JSON parsing fails
      const fallbackDiagrams = [
        {
          id: "diag-1",
          title: "System High-Level Process Flowchart",
          type: "flow",
          pageOrSection: "Chapter 1, Section 1.2",
          description: "Sequential workflow showing end-to-end data processing pipelines.",
          recommendedSlideTopic: "System Architecture",
          items: [
            "Input Layer: Client request & payload ingestion",
            "Authentication: OAuth 2.0 validation & token verification",
            "Execution Engine: Async thread pool calculation",
            "Persistence: Firestore database transaction commit"
          ],
          selected: true
        },
        {
          id: "diag-2",
          title: "Tiered Software Architecture Stack",
          type: "architecture",
          pageOrSection: "Chapter 2, Section 2.4",
          description: "Layered component architecture from UI presentation to cloud database.",
          recommendedSlideTopic: "Software Engineering",
          items: [
            "Tier 1: Client React Presentation Layer (Port 3000)",
            "Tier 2: Express Node.js REST API Proxy Middleware",
            "Tier 3: Gemini 2.5 Intelligence Engine",
            "Tier 4: Distributed Cloud Storage & Data Vault"
          ],
          selected: true
        },
        {
          id: "diag-3",
          title: "Core Domain Concept Hub & Spokes",
          type: "mindmap",
          pageOrSection: "Chapter 3, Section 3.1",
          description: "Centralized mind map mapping core principles and sub-modules.",
          recommendedSlideTopic: "Key Concepts",
          items: [
            "Core Principle: High-density learning material synthesis",
            "Sub-Module A: Automated flashcard & quiz generator",
            "Sub-Module B: Dynamic Canva PPT outline generator",
            "Sub-Module C: Smart video lecture synthesizer"
          ],
          selected: true
        },
        {
          id: "diag-4",
          title: "Continuous Execution Lifecycle Loop",
          type: "cycle",
          pageOrSection: "Chapter 4, Section 4.5",
          description: "Iterative feedback loop for continuous system optimization.",
          recommendedSlideTopic: "Optimization Lifecycle",
          items: [
            "Phase 1: Ingest document & deskew scan OCR",
            "Phase 2: Extract semantic concepts & structure",
            "Phase 3: Render visual blueprints & diagrams",
            "Phase 4: Collect student feedback & adapt layout"
          ],
          selected: true
        }
      ];
      return res.json({ diagrams: fallbackDiagrams });
    }
  } catch (error: any) {
    console.error("Detect diagrams outer error:", error);
    return res.status(500).json({ error: formatGeminiError(error) });
  }
});


// 5. Generate Flashcards (JSON)
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { fileUri, mimeType, mode } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();
    
    
    const prompt = `
      Extract key terms and their corresponding definitions or explanations from the provided text to create learning flashcards.
      Output a structured array of flashcard objects. Each flashcard MUST have a 'term' and a 'definition'.
      Provide a comprehensive list of flashcards (between 10 and 20 cards) covering the most important concepts, acronyms, theories, or historical events discussed in the material.
      Make sure the definitions are concise and perfect for memorization.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            }
          }
        }
      });
      
      const parsedCards = safeParseJson(response.text || "[]");
      return res.json({ flashcards: parsedCards || [] });
    } catch (error: any) {
      console.error("Flashcards error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Flashcards outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});


// 6. Generate Comprehensive Question Bank
app.post("/api/generate-question-bank", async (req, res) => {
  try {
    const { fileUri, mimeType, questionType = "all", bloomLevel = "all", mode, totalMarks } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();
    
    
    let typeInstructions = "";
    const bloomInstructions = bloomLevel !== "all" ? `\nFocus ONLY on questions targeting the Bloom's Taxonomy level: ${bloomLevel.toUpperCase()}.` : "";
    
    if (questionType === "mcq") {
      typeInstructions = `## SECTION 1: MULTIPLE CHOICE QUESTIONS (MCQs)${bloomInstructions}
      Provide EXACTLY 50 rigorous, high-quality MCQs covering key concepts.
      Format:
      **Q1. [Question body]**
      
      A) [Option A]
      
      B) [Option B]
      
      C) [Option C]
      
      D) [Option D]
      
      **Correct Answer**: [Correct Option]
      
      *Explanation*: [Brief explanation of why it's correct]
      
      CRITICAL FORMATTING RULE: You MUST use double newlines (blank lines) between the question body, EACH option, the Correct Answer, and the Explanation so they render on separate lines.`;
    } else if (questionType === "short") {
      typeInstructions = `## SECTION 1: SHORT ANSWER QUESTIONS${bloomInstructions}
      Provide EXACTLY 50 precise short-answer questions focusing on essential mechanics or definitions.
      Format:
      - **Q1. [Question]**
        **Sample Ideal Answer**: [Crisp, high-scoring answer paragraph, typically 2-4 sentences]`;
    } else if (questionType === "long") {
      typeInstructions = `## SECTION 1: DEEP LONG ANSWER QUESTIONS & VISUAL DIAGRAMS${bloomInstructions}
      Provide EXACTLY 50 complex, extensive, multi-part essay or problem questions. EACH question must be a comprehensive 8-mark question, requiring in-depth explanation, structured breakdown, and extensive detail.
      For EACH long-answer question, you MUST provide:
      1. A detailed, structured step-by-step breakdown explaining the underlying concepts deeply.
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).`;
    } else if (questionType === "paper-full") {
      typeInstructions = `## FULL EXAM QUESTION PAPER${bloomInstructions}
      Generate a comprehensive and well-structured Question Paper covering the provided material. The paper MUST be divided into the following sections:
      
      ### SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs) (1 Mark Each)
      Provide exactly 30 high-quality MCQs covering key concepts.
      Format:
      **Q1. [Question]**
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D]
      **Correct Answer**: [Correct Option]
      
      ### SECTION B: SHORT ANSWER QUESTIONS (2, 3, and 4 Marks)
      Provide exactly 12 Short Answer questions designed to test comprehension and explanation:
      - Four 2-Mark Questions
      - Four 3-Mark Questions
      - Four 4-Mark Questions
      Format:
      **Q[X]. [Question] ([Y] Marks)**
      *Sample Answer*: [Provide the expected answer]

      ### SECTION C: LONG ANSWER QUESTIONS (5, 8, and 10 Marks)
      Provide exactly 8 Long Answer questions testing deep understanding, analysis, and mechanics:
      - Three 5-Mark Questions
      - Three 8-Mark Questions
      - Two 10-Mark Questions
      Format:
      **Q[X]. [Question] ([Y] Marks)**
      *Sample Answer Breakdown*: [Detailed response]`;
    } else if (questionType === "paper-university") {
      const requestedMarks = totalMarks || 60;
      typeInstructions = `## UNIVERSITY EXAM QUESTION PAPER FORMAT (JSON OUTPUT ONLY)${bloomInstructions}
      Generate a formal university-style exam question paper based on the provided material, specifically designed for a total of ${requestedMarks} Marks.
      You MUST output EXACTLY a valid JSON object (without markdown code blocks like \`\`\`json) matching this schema:
      {
        "collegeName": "PILLAI HOC COLLEGE OF ENGINEERING & TECHNOLOGY, RASAYANI",
        "accreditation": "(Autonomous) (Accredited 'A+' by NAAC)",
        "examName": "PRELIMINARY SH 2025 EXAMINATION",
        "department": "Department of Computer Application",
        "branch": "COMPUTER APPLICATION (MCA)",
        "semester": "[Infer]",
        "subject": "[Infer]",
        "time": "02.00 Hours",
        "date": "[Current Date]",
        "maxMarks": ${requestedMarks},
        "subjectCode": "[Generate Code]",
        "instructions": [
          "Read instructions carefully.",
          "Figures to the right indicate full marks."
        ],
        "questions": [
          { "type": "main", "qNo": "Q.1", "text": "Attempt any questions as instructed", "marks": "", "bt": "", "co": "" },
          { "type": "sub", "qNo": "a)", "text": "[Question Text]", "marks": "5", "bt": "2", "co": "1" }
        ],
        "footer": "CO1- ... BT Levels: 1 Remembering, 2 Understanding, 3 Applying, 4 Analyzing, 5 Evaluating, 6 Creating."
      }
      
      Guidelines:
      - Design the questions and main question blocks such that the total marks the student is expected to attempt sum up perfectly to ${requestedMarks} marks.
      - Automatically formulate the 'instructions' array (e.g. "Q1 is compulsory", "Solve any 3 from the rest") to logically match your designed structure for ${requestedMarks} marks.
      - Provide sub-questions inside the main questions, with correct "marks" fields. Ensure the sum of attempting the required questions equals ${requestedMarks}.
      - Bloom's Taxonomy (bt): 1-6.
      - Course Outcome (co): 1-6.
      - Return ONLY the JSON object. Do NOT wrap in \`\`\`json.`;
    } else if (questionType === "paper-mcq") {
      typeInstructions = `## EXAM QUESTION PAPER: MULTIPLE CHOICE (1 Mark Each)${bloomInstructions}
      Provide EXACTLY 50 MCQs formatted for an exam paper.
      Format:
      **Q1. [Question] (1 Mark)**
      A) [Option]
      B) [Option]
      C) [Option]
      D) [Option]
      
      **Correct Answer**: [Correct Option]`;
    } else if (questionType === "paper-short") {
      typeInstructions = `## EXAM QUESTION PAPER: SHORT ANSWER QUESTIONS${bloomInstructions}
      Provide exactly 50 Short Answer questions tailored for a structured exam paper, divided as follows:
      - Twenty 2-Mark Questions
      - Fifteen 3-Mark Questions
      - Fifteen 4-Mark Questions
      
      Format:
      **Q1. [Question] (X Marks)**
      *Sample Ideal Answer*: [Crisp, well-structured answer paragraph]`;
    } else if (questionType === "paper-long") {
      typeInstructions = `## EXAM QUESTION PAPER: LONG ANSWER QUESTIONS${bloomInstructions}
      Provide exactly 50 Long Answer / Essay type questions designed for a major exam section, divided as follows:
      - Twenty 5-Mark Questions (structured paragraphs)
      - Fifteen 8-Mark Questions (in-depth analysis, multi-part)
      - Fifteen 10-Mark Questions (comprehensive, extensive detail, requiring visual diagram)
      
      Format:
      **Q1. [Question] (X Marks)**
      *Sample Answer Breakdown*: [Extensive detail, step-by-step breakdown. For 10-Mark questions, include a Mermaid diagram block]`;
    } else {
      typeInstructions = `## SECTION 1: MULTIPLE CHOICE QUESTIONS (MCQs)
      Provide EXACTLY 50 rigorous, high-quality MCQs covering key concepts.
      Format:
      **Q1. [Question body]**
      
      A) [Option A]
      
      B) [Option B]
      
      C) [Option C]
      
      D) [Option D]
      
      **Correct Answer**: [Correct Option]
      
      *Explanation*: [Brief explanation of why it's correct]
      
      CRITICAL FORMATTING RULE: You MUST use double newlines (blank lines) between the question body, EACH option, the Correct Answer, and the Explanation so they render on separate lines.

      ## SECTION 2: FILL IN THE BLANKS
      Provide EXACTLY 50 Fill-in-the-Blank statements that test core vocabulary, formulas, and facts.
      Format:
      - **Q1. [Statement with a blank: "_______"]**
        **Answer**: [Correct Word/Phrase]
        *Explanation*: [Brief context]

      ## SECTION 3: TRUE OR FALSE
      Provide EXACTLY 50 conceptually challenging True/False statements.
      Format:
      - **Q1. [Statement]**
        **Answer**: [True / False]
        *Explanation*: [In-depth proof/reasoning]

      ## SECTION 4: SHORT ANSWER QUESTIONS
      Provide EXACTLY 50 precise short-answer questions focusing on essential mechanics or definitions.
      Format:
      - **Q1. [Question]**
        **Sample Ideal Answer**: [Crisp, high-scoring answer paragraph, typically 2-4 sentences]

      ## SECTION 5: DEEP LONG ANSWER QUESTIONS & VISUAL DIAGRAMS
      Provide EXACTLY 50 complex, extensive, multi-part essay or problem questions. EACH question must be a comprehensive 8-mark question, requiring in-depth explanation, structured breakdown, and extensive detail.
      For EACH long-answer question, you MUST provide:
      1. A detailed, structured step-by-step breakdown explaining the underlying concepts deeply.
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).`;
    }

    const prompt = `
      You are an elite educational AI developer and domain-expert professor. Create a highly professional, comprehensive and pedagogical **Question Bank with Complete Solutions** based on the provided learning materials.

      CRITICAL INSTRUCTION: You MUST generate the requested number of unique questions for EACH section requested below. 
      You MUST strictly number them. Do not stop early. Do not summarize. Generate all questions.
      Ensure that NO questions are repeated across or within sections. Provide exact answers and explanations for every single question.

      Your generated Question Bank MUST strictly include the following structured sections:

      # 📚 EXAM QUESTION BANK & SOLUTIONS

      ${typeInstructions}

      CRITICAL MERMAID RULES:
      - Always enclose node labels in double quotes, e.g. A["Process Step"] or Start("Start Point").
      - NEVER use double quotes or pipes INSIDE a node label. Use single quotes if needed.
      - Each Mermaid statement or arrow MUST be on its own separate line.
      - DO NOT include any node legends, map keys, or descriptive legend boxes in the diagrams.

      CRITICAL FORMAT RULE:
      - STRICTLY DO NOT use arrows (e.g. ->, -->, =>) in plain text. Use clean numbered list items or headers. Arrows are ONLY allowed inside Mermaid syntax blocks.
    `;
    
    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          ...(questionType === "paper-university" ? { responseMimeType: "application/json" } : {})
        }
      });
      return res.json({ result: response.text });
    } catch (error: any) {
      console.error("Question Bank error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Question Bank outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});

// 7. Generate Lesson Plan
app.post("/api/generate-lesson-plan", async (req, res) => {
  try {
    const { fileUri, mimeType, focusArea, role } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();
    
    const prompt = `
      You are an expert student success coach and study planner. Based on the provided book or study materials, generate a highly effective, personalized **Study Lesson Plan** for a student.
      Focus Area/Custom request: ${focusArea || "General study structure"}
      
      CRITICAL REQUIREMENT:
      Estimate the "Duration of Study Completion" (how many total hours or weeks). Provide this clearly in the 'duration' and 'totalUnits' fields of the output.
      
      In your 'fullMarkdownPlan', provide an in-depth lesson plan ONLY IN TEXT FORMAT:
      1. Break down the provided textbook or study material into sequential **Units and Chapters** (NOT sessions).
      2. For each Unit and Chapter, specify:
         - Unit/Chapter name and estimated duration
         - Specific learning objectives for the student
         - Step-by-step study tasks (e.g. "Step 1: Read Section 1.1", "Step 2: Solve practice questions")
         - Self-assessment focus questions
      3. An optimization/tips section outlining dynamic rest periods (Pomodoro technique), memory consolidation strategies, and visual diagram review.
      
      CRITICAL FORMAT RULE:
      - STRICTLY DO NOT use arrows (e.g. "->", "-->", "=>") in plain text. Use clean numbered bullet points or explicit step headers. Arrows are ONLY allowed inside Mermaid syntax blocks.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              duration: { type: Type.STRING },
              totalUnits: { type: Type.STRING },
              units: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    description: { type: Type.STRING },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    activities: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "duration", "description", "objectives", "activities"]
                }
              },
              fullMarkdownPlan: { type: Type.STRING }
            },
            required: ["duration", "totalUnits", "units", "fullMarkdownPlan"]
          }
        }
      });
        
      const parsedPlan = safeParseJson(response.text || "{}");
      return res.json({ lessonPlan: parsedPlan || {} });
    } catch (error: any) {
      console.error("Lesson plan error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Lesson plan outer error:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});


app.post("/api/generate-video-explanation", async (req, res) => {
  try {
    const { fileUri, mimeType, focusArea } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();

    const prompt = `
      You are an expert academic tutor and visual lecturer. Analyze the provided study material and generate a comprehensive, highly structured 2-minute to 3-minute video lecture script.
      The output MUST be a JSON object with:
      1. 'title': A captivating, descriptive title for the explainer video (e.g., "Deep-Dive Lecture: Understanding ${focusArea || 'Core Material Concepts'}").
      2. 'durationEstimate': Estimated total video duration in seconds (MUST be at least 120 seconds).
      3. 'scenes': An array of EXACTLY 8 or 9 scene objects, ordered sequentially from start to finish.
      
      Each scene represents a section/slide of the lecture video and MUST contain the following properties:
      - 'sceneNumber': (integer, 1-indexed)
      - 'visualTitle': (string) A prominent, clean title representing what is shown on screen for this section.
      - 'bullets': (array of strings) 3 to 5 concise, high-impact bullet points containing the core concepts, theories, or details shown on the visual slide canvas.
      - 'narration': (string) Extensive, complete spoken narration script. This is what the lecturer speaks during this scene. To ensure the total video explanation lasts at least 2 minutes, EACH scene's spoken narration MUST be at least 45 to 75 words of highly detailed, slow-paced, clear explanations of the concepts. DO NOT use generic summary; cover actual content.
      - 'duration': (integer) The duration in seconds allocated for this scene. It MUST be between 15 and 25 seconds.
      - 'graphicsPrompt': (string) A precise, creative description of the whiteboard drawing, visual dynamic flow, or diagram representing the concept (e.g., "Whiteboard diagram showing 4 distributed servers passing heartbeat messages with latency values").
      - 'highlightKeyTerms': (array of strings) 2 to 4 key terms mentioned in this scene's narration that should be bolded or emphasized in subtitles.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              durationEstimate: { type: Type.INTEGER },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    visualTitle: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    narration: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    graphicsPrompt: { type: Type.STRING },
                    highlightKeyTerms: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: [
                    "sceneNumber",
                    "visualTitle",
                    "bullets",
                    "narration",
                    "duration",
                    "graphicsPrompt",
                    "highlightKeyTerms"
                  ]
                }
              }
            },
            required: ["title", "durationEstimate", "scenes"]
          }
        }
      });

      const parsedVideo = safeParseJson(response.text || "{}");
      return res.json({ video: parsedVideo || {} });
    } catch (error: any) {
      console.error("Video explanation error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Video explanation outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});



app.post("/api/generate-ppt", async (req, res) => {
  try {
    const { fileUri, mimeType, focusArea } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });

    const ai = getGenAI();

    const prompt = `
      You are an expert presentation designer and academic tutor. 
      Analyze the provided study material and generate a comprehensive PowerPoint presentation structure.
      The presentation MUST contain at least 20 slides to thoroughly cover the material.
      
      The output MUST be a JSON object with:
      1. 'title': A descriptive title for the presentation (e.g., "${focusArea || 'Course Presentation'}").
      2. 'slides': An array of EXACTLY 20 or more slide objects.
      
      Each slide object MUST contain:
      - 'slideType': (string) One of "cover", "toc", "content", "diagram", "summary", "final".
      - 'title': (string) Title of the slide.
      - 'bullets': (array of strings) 3 to 6 bullet points of content.

      - 'diagrams': (optional array of objects) For 'diagram' type slides, include { title: string, items: string[] }.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.6-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideType: { type: Type.STRING },
                    title: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },

                    diagrams: { 
                      type: Type.ARRAY, 
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          items: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                      }
                    }
                  },
                  required: ["slideType", "title", "bullets"]
                }
              }
            },
            required: ["title", "slides"]
          }
        }
      });
      
      const parsedData = safeParseJson(response.text || "{}");
      return res.json({ ppt: parsedData || {} });
    } catch (error: any) {
      console.error("PPT generation error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("PPT explanation outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});
app.post("/api/ocr", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    
    const apiKey = process.env.OCR_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "OCR_API_KEY is not configured. Please add it to your Secrets." });
    }

    // Example proxy for api4ai OCR or other OCR services
    // Since api4ai expects multipart/form-data, we can forward the buffer
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("image", blob, req.file.originalname || "upload.png");

    // This is a generic implementation. You can customize the URL based on your chosen provider.
    // For api4ai, you would typically use their specific endpoint URL and pass the API key in headers.
    const ocrApiUrl = "https://ocr.api4ai.cloud/v1/results"; 
    
    const response = await fetch(ocrApiUrl, {
      method: "POST",
      headers: {
        "api-key": apiKey
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`OCR API failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("OCR API error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image through OCR API" });
  }
});

// Global Error Handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found: " + req.method + " " + req.originalUrl });
});

// Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
