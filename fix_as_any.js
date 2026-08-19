import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/\} as any : \{\}\)\}/g, '} as React.CSSProperties : {})}');
content = content.replace(/\} as any : \{\}/g, '} as React.CSSProperties : {}');
fs.writeFileSync('src/App.tsx', content);
