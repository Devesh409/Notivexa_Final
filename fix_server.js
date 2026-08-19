import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /let lengthInstructions = `1\. Generate a highly detailed[\s\S]*?} else if \(summaryLength === "comprehensive"\) \{[\s\S]*?\}/;
const replacement = `let lengthInstructions = \`1. EXHAUSTIVE SUMMARY REQUIRED: Generate an extremely long, exhaustive, minimum 50+ pages equivalent summary of the provided e-book.
      2. You MUST cover EVERY SINGLE chapter, sub-chapter, section, paragraph, and concept in excruciating detail. Do NOT skip anything.
      3. Provide extensive explanations, exhaustive examples, deep theoretical breakdowns, and all relevant formulas or code snippets.
      4. Keep generating until you hit the maximum token limit. The output must be as massively detailed as possible to simulate a 50+ page output.
      5. SPLIT INTO PAGES: You MUST divide the summary into distinct notebook pages. After every 200-250 words, or at logical chapter breaks, insert the EXACT string "---PAGE_BREAK---" on a new line. Continue this for the entire summary.\`;`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Replaced successfully in server.ts");
} else {
    console.log("Regex not matched in server.ts");
}
