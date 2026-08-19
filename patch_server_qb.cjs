const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldRouteStr = `// 6. Generate Comprehensive Question Bank
app.post("/api/generate-question-bank", async (req, res) => {
  try {
    const { fileUri, mimeType } = req.body;`;

const newRouteStr = `// 6. Generate Comprehensive Question Bank
app.post("/api/generate-question-bank", async (req, res) => {
  try {
    const { fileUri, mimeType, questionType = "all" } = req.body;`;

if (code.includes(oldRouteStr)) {
    code = code.replace(oldRouteStr, newRouteStr);
    
    // Now replace the prompt section.
    // I will replace from `const prompt = \`` to the end of the template literal.
    
    // Actually let's just write a function to replace the entire route body to be safe.
} else {
    console.log("Could not find oldRouteStr");
}
