const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, initialDelayMs = 1200, failFastOnOverload = false): Promise<T> {`;
const replace = `async function withRetry<T>(operation: () => Promise<T>, maxRetries = 1, initialDelayMs = 500, failFastOnOverload = false): Promise<T> {`;

code = code.replace(target, replace);
fs.writeFileSync('server.ts', code);
console.log("Patched defaults");
