const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace('ArrowRight, Sparkles } from "lucide-react";', 'ArrowRight, Sparkles, ChevronDown } from "lucide-react";');
fs.writeFileSync('src/App.tsx', content);
console.log("Patched 3!");
