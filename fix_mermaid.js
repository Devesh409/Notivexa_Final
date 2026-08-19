import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /mermaid.initialize\(\{/,
  `mermaid.initialize({\n      htmlLabels: false,`
);
fs.writeFileSync('src/App.tsx', code);
