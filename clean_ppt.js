import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

// Drop 2850 to 2865
// Drop 2936 to 2951

let newLines = [];
for(let i=0; i<lines.length; i++) {
    if (i >= 2849 && i <= 2864) continue;
    if (i >= 2935 && i <= 2950) continue;
    newLines.push(lines[i]);
}

let newContent = newLines.join('\n');
newContent = newContent.replace(/\{resultType !== "ppt" && resultType !== "lesson-plan" && \(/g, '{resultType !== "lesson-plan" && (');
fs.writeFileSync('src/App.tsx', newContent);
