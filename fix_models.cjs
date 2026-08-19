const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];`;
  
const replacement = `  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro"
  ];`;
  
if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Replaced");
} else {
    console.log("Not found");
}
