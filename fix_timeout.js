import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /let lengthInstructions = `1\. EXHAUSTIVE SUMMARY REQUIRED: Generate an extremely long, exhaustive, minimum 50\+ pages equivalent summary of the provided e-book\.\n.*?---PAGE_BREAK---" on a new line\. Continue this for the entire summary\.`;/s;
const replacement = `let lengthInstructions = \`1. Generate a highly detailed and comprehensive chapter-wise summary of the provided text.
      2. Cover the core chapters, key concepts, theories, and examples in detail.
      3. SPLIT INTO PAGES: You MUST divide the summary into distinct notebook pages. After every 200-250 words, or at logical chapter breaks, insert the EXACT string "---PAGE_BREAK---" on a new line. Continue this for the entire summary.\`;`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Replaced successfully in server.ts");
} else {
    console.log("Regex not matched in server.ts");
}
