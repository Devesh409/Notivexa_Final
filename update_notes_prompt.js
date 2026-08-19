import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const oldPromptRegex = /let lengthInstructions = `1\. Generate a concise, high-level summary of the provided text\.\n      2\. Focus ONLY on the most critical concepts, theories, and examples\. Keep it brief to ensure fast generation\.\n      3\. SPLIT INTO PAGES: You MUST divide the summary into distinct notebook pages\. After every 200-250 words, or at logical chapter breaks, insert the EXACT string "---PAGE_BREAK---" on a new line\.`;/s;
const newPrompt = `let lengthInstructions = \`1. Generate the absolute maximum possible length for a comprehensive chapter-wise summary of the provided text.
      2. The user has requested up to 100 pages. Generate as much deep, exhaustive detail as you physically can within your token limit. Cover all core chapters, key concepts, theories, and examples in extreme depth.
      3. SPLIT INTO PAGES: You MUST divide the summary into distinct notebook pages. After every 200-250 words, or at logical chapter breaks, insert the EXACT string "---PAGE_BREAK---" on a new line.\`;`;

code = code.replace(oldPromptRegex, newPrompt);

const oldGenRegex = /const response = await generateContentWithFallback\(ai, \{\n\s*model: "gemini-2\.5-flash",\n\s*contents: await getContentParts\(fileUri, mimeType, prompt\)\n\s*\}\);/s;
const newGen = `const response = await generateContentWithFallback(ai, {
        model: "gemini-2.5-pro",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          maxOutputTokens: 8192,
        }
      });`;

code = code.replace(oldGenRegex, newGen);

fs.writeFileSync('server.ts', code);
console.log("Updated prompt and token limits successfully.");
