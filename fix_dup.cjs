const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The sed command replaced `const [pptScope` twice because there might have been multiple occurrences or something. Let's fix it.
// It seems it replaced `const [pptScope, setPptScope] = useState<"full" | "chapter" | "topic" | "custom">("full");` 
// and `const [pptScopeValue, setPptScopeValue] = useState("");` maybe.
// Let's just use regex to remove the duplicate `const [questionBankType, setQuestionBankType] = useState("all");\n`

let lines = code.split('\n');
let seen = false;
let out = [];
for (let line of lines) {
    if (line.includes('const [questionBankType, setQuestionBankType] = useState("all");')) {
        if (!seen) {
            seen = true;
            out.push(line);
        }
    } else {
        out.push(line);
    }
}
fs.writeFileSync('src/App.tsx', out.join('\n'));
console.log("Success");
