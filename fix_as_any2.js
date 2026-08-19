import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace newlines and spaces around as any
content = content.replace(/\}\n\s*as any : \{\}\)\}/g, '} as any : {})}');
content = content.replace(/\}\n\s*as any : \{\}\}/g, '} as any : {}}');
content = content.replace(/\}\n\s*as React\.CSSProperties : \{\}\)\}/g, '} as React.CSSProperties : {})}');
content = content.replace(/\} as any/g, '} as React.CSSProperties');
fs.writeFileSync('src/App.tsx', content);
