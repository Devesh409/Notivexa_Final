const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "question-bank"
      );`;

const replaceStr = `      // Client-side cache check to prevent double API calls & save quota
      const cached = history.find(
        (item) => item.fileUri === fileData.fileUri && item.type === "question-bank" && item.questionBankType === questionBankType
      );`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
} else {
    console.log("Could not find cached logic");
}

const targetStr2 = `body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType })`;
const replaceStr2 = `body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, questionType: questionBankType })`;

// There are multiple `body: JSON.stringify` maybe, so I should just do a string replace exactly where it matters. Let's find the exact block.
const apiTarget = `      const res = await fetch("/api/generate-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType }),
      });`;
      
const apiReplace = `      const res = await fetch("/api/generate-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, questionType: questionBankType }),
      });`;

if (code.includes(apiTarget)) {
    code = code.replace(apiTarget, apiReplace);
} else {
    console.log("Could not find apiTarget");
}

const dbTarget = `          type: "question-bank",
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,`;
const dbReplace = `          type: "question-bank",
          questionBankType: questionBankType,
          fileUri: fileData.fileUri,
          mimeType: fileData.mimeType,`;

if (code.includes(dbTarget)) {
    code = code.replace(dbTarget, dbReplace);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
