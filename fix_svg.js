import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const s = svg as any;\n\s*s\.style\.maxWidth = '100%';/g,
  `const s = svg as any;\n          const bbox = s.getBoundingClientRect();\n          if (bbox.width && bbox.height) {\n            s.setAttribute('width', bbox.width + 'px');\n            s.setAttribute('height', bbox.height + 'px');\n          }\n          s.style.maxWidth = '100%';`
);
fs.writeFileSync('src/App.tsx', code);
