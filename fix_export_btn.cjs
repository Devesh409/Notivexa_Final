const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldStr = '{mode === "student" && resultType !== "ppt" && resultType !== "lesson-plan" && (';
const newStr = '{resultType !== "ppt" && resultType !== "lesson-plan" && (';

if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
