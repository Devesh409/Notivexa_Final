import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const modelsToTry = \[\s*"gemini-2\.5-flash",\s*"gemini-2\.0-flash",\s*"gemini-1\.5-flash",\s*"gemini-1\.5-pro"\s*\];/,
  'const modelsToTry = [\n    "gemini-2.5-flash",\n    "gemini-2.5-pro",\n    "gemini-flash-latest",\n    "gemini-pro-latest"\n  ];'
);

fs.writeFileSync('server.ts', code);
console.log("Replaced successfully in server.ts");
