const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const modelsTarget = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro"
  ];`;
  
const modelsReplace = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ];`;
  
code = code.replace(modelsTarget, modelsReplace);

const retryTarget = `return await withRetry(() => ai.models.generateContent(apiParams), hasMoreModels ? 1 : 2, 1000, hasMoreModels);`;
const retryReplace = `return await withRetry(() => ai.models.generateContent(apiParams), 0, 500, hasMoreModels);`;

code = code.replace(retryTarget, retryReplace);

fs.writeFileSync('server.ts', code);
console.log("Patched fast fail");
