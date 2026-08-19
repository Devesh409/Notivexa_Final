import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const isHighLevelHeading = tagName === 'h1' \|\| tagName === 'h2' \|\| child\.querySelector\?\.\('h1, h2'\) \!\=\= null;/g,
  `const isHighLevelHeading = tagName === 'h1' || child.querySelector?.('h1') !== null;`
);
fs.writeFileSync('src/App.tsx', code);
