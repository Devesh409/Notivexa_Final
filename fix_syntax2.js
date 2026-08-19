import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The bottom is:
//       )}
//       </div>
//       </div>
//     </div>
//   );
// }
// Let's replace the last `</div>`s with just `</>  ); }` if the root was a fragment, or `</div> ); }` if it was a div.

content = content.replace(/      \}\)\n      <\/div>\n      <\/div>\n    <\/div>\n  \);\n\}/, '      )}\n    </>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
