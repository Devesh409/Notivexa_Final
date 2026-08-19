const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{ resultText.split('---SET_SEPARATOR---').map((setMarkdown, index) => (
                        <div key={index} className="mb-10">
                          <ReactMarkdown`;

const replacement = `{ resultText.split('---SET_SEPARATOR---').map((setMarkdown, index) => (
                        <div key={index} className="mb-10">
                          {setMarkdown.split('---PAGE_BREAK---').map((pageMarkdown, pageIndex, arr) => (
                            <div key={\`page-\${pageIndex}\`} className="page-break-before relative mb-12">
                              {pageIndex > 0 && (
                                <div className="w-full flex items-center justify-center my-12 opacity-50">
                                  <div className="h-px bg-[#5A5A40] flex-1"></div>
                                  <span className="px-4 text-xs font-sans uppercase tracking-widest text-[#5A5A40]">Page Break</span>
                                  <div className="h-px bg-[#5A5A40] flex-1"></div>
                                </div>
                              )}
                              <ReactMarkdown`;

code = code.replace(target, replacement);

const targetEnd = `                                  );
                                }
                                if (/^Q\\d+\\.\\s+/.test(content) && content.includes("Correct Answer:")) {`;

const replacementEnd = `                                  );
                                }
                                if (/^Q\\d+\\.\\s+/.test(content) && content.includes("Correct Answer:")) {`;

// Wait, I need to close the tags properly.
// The original structure is:
// <ReactMarkdown ... />
// </div>
// ))}
// </div>
// Let's use a regex to find the end of ReactMarkdown.
