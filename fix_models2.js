import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  /const modelsToTry = \[\s*"gemini-flash-latest",\s*"gemini-3.5-flash-lite",\s*"gemini-2.0-flash"\s*\];/,
  `const modelsToTry = [\n    "gemini-2.5-flash",\n    "gemini-2.0-flash",\n    "gemini-1.5-flash",\n    "gemini-1.5-pro"\n  ];`
);
fs.writeFileSync('server.ts', code);
