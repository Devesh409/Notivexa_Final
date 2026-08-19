const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Reduce modelsToTry to avoid long fallback chains that cause 504 timeouts
const modelsTarget = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest"
  ];`;
  
const modelsReplace = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];`;
  
code = code.replace(modelsTarget, modelsReplace);

// Also change maxRetries when hasMoreModels is false
const retryTarget = `return await withRetry(() => ai.models.generateContent(apiParams), hasMoreModels ? 1 : 3, 1200, hasMoreModels);`;
const retryReplace = `return await withRetry(() => ai.models.generateContent(apiParams), hasMoreModels ? 1 : 2, 1000, hasMoreModels);`;

code = code.replace(retryTarget, retryReplace);

fs.writeFileSync('server.ts', code);
console.log("Patched retry logic");
