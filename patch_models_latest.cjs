const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ];`;
  
const replace = `  const modelsToTry = [
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash"
  ];`;

code = code.replace(target, replace);
fs.writeFileSync('server.ts', code);
console.log("Patched models");
