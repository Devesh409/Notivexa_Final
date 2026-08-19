import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The incorrect sed replaced:
// "  }" with "    </div>\n  }\n"
// So we want to replace "    </div>\n  }\n" with "  }" globally.
content = content.replace(/    <\/div>\n  \}\n/g, '  }\n');

// Then we manually add one "</div>" to the end of the file before the final "  }".
content = content.replace(/    <\/div>\n  \}\n$/, '  }\n'); // in case it was at the end
// Let's just find the end of the file and do it right.
content = content.replace(/  \}\n$/, '    </div>\n  }\n');

fs.writeFileSync('src/App.tsx', content);
