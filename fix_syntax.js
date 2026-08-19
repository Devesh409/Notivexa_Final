import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the stray Python script button
content = content.replace(/                      className="border border-\[#5A5A40\] text-\[#5A5A40\] hover:bg-\[#FAF9F6\] py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"\n                    >\n                      <Download size=\{14\} \/> Download Python Script\n                    <\/button>\n                  <\/div>\n                \)\}/, '');

// 2. We had a stray closing bracket?
// 3166:11: ERROR: The character "}" is not valid inside a JSX element
// Let's check what's around 3166.
fs.writeFileSync('src/App.tsx', content);
