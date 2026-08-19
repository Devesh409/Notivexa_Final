const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{mode === "student" && resultType !== "ppt" && resultType !== "lesson-plan" && (`;
console.log(code.includes(target) ? "Found" : "Not found");
