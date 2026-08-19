const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-2.5-pro",
        contents: await getContentParts(fileUri, mimeType, prompt)
      });`;

const replacement1 = `    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-2.5-pro",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        }
      });`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
} else {
    console.log("Could not find generation block.");
}

// Emphasize the numbering:
const target2 = `CRITICAL INSTRUCTION: You MUST generate EXACTLY 50 unique questions for EACH section requested below. 
      Ensure that NO questions are repeated across or within sections. Provide exact answers and explanations for every single question. DO NOT add any extra questions beyond the 50 per section.`;

const replacement2 = `CRITICAL INSTRUCTION: You MUST generate EXACTLY 50 unique questions for EACH section requested below. 
      You MUST strictly number them from Q1 to Q50. Do not stop early. Do not summarize. Generate all 50 questions.
      Ensure that NO questions are repeated across or within sections. Provide exact answers and explanations for every single question. DO NOT add any extra questions beyond the 50 per section. DO NOT STOP UNTIL YOU REACH Q50.`;

if (code.includes(target2)) {
    code = code.replace(target2, replacement2);
} else {
    console.log("Could not find instruction block.");
}

fs.writeFileSync('server.ts', code);
console.log("Success");
