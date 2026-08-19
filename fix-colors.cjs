const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Flashcards View \*\/\}(.|\n)*?\{\/\* Navigation Controls \*\/\}/g;

const replacement = `              {/* Flashcards View */}
              {flashcards.length > 0 && (() => {
                const cardThemes = [
                  {
                    front: isDarkMode ? "bg-gradient-to-br from-indigo-900/20 to-[#1A1A17] border-indigo-900/30" : "bg-gradient-to-br from-indigo-50 via-white to-indigo-50/40 border-indigo-100",
                    frontTag: isDarkMode ? "text-indigo-300 bg-indigo-900/30 border-indigo-800/50" : "text-indigo-600 bg-indigo-100/50 border-indigo-200",
                    frontAccent: "from-indigo-200/40",
                    back: isDarkMode ? "bg-gradient-to-bl from-violet-900/20 to-[#22221F] border-violet-900/30" : "bg-gradient-to-bl from-violet-50 via-white to-violet-50/40 border-violet-100",
                    backTag: isDarkMode ? "text-violet-300 bg-violet-900/30 border-violet-800/50" : "text-violet-600 bg-violet-100/50 border-violet-200",
                    backAccent: "from-violet-200/40"
                  },
                  {
                    front: isDarkMode ? "bg-gradient-to-br from-emerald-900/20 to-[#1A1A17] border-emerald-900/30" : "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-emerald-100",
                    frontTag: isDarkMode ? "text-emerald-300 bg-emerald-900/30 border-emerald-800/50" : "text-emerald-600 bg-emerald-100/50 border-emerald-200",
                    frontAccent: "from-emerald-200/40",
                    back: isDarkMode ? "bg-gradient-to-bl from-teal-900/20 to-[#22221F] border-teal-900/30" : "bg-gradient-to-bl from-teal-50 via-white to-teal-50/40 border-teal-100",
                    backTag: isDarkMode ? "text-teal-300 bg-teal-900/30 border-teal-800/50" : "text-teal-600 bg-teal-100/50 border-teal-200",
                    backAccent: "from-teal-200/40"
                  },
                  {
                    front: isDarkMode ? "bg-gradient-to-br from-amber-900/20 to-[#1A1A17] border-amber-900/30" : "bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-amber-100",
                    frontTag: isDarkMode ? "text-amber-300 bg-amber-900/30 border-amber-800/50" : "text-amber-600 bg-amber-100/50 border-amber-200",
                    frontAccent: "from-amber-200/40",
                    back: isDarkMode ? "bg-gradient-to-bl from-orange-900/20 to-[#22221F] border-orange-900/30" : "bg-gradient-to-bl from-orange-50 via-white to-orange-50/40 border-orange-100",
                    backTag: isDarkMode ? "text-orange-300 bg-orange-900/30 border-orange-800/50" : "text-orange-600 bg-orange-100/50 border-orange-200",
                    backAccent: "from-orange-200/40"
                  },
                  {
                    front: isDarkMode ? "bg-gradient-to-br from-rose-900/20 to-[#1A1A17] border-rose-900/30" : "bg-gradient-to-br from-rose-50 via-white to-rose-50/40 border-rose-100",
                    frontTag: isDarkMode ? "text-rose-300 bg-rose-900/30 border-rose-800/50" : "text-rose-600 bg-rose-100/50 border-rose-200",
                    frontAccent: "from-rose-200/40",
                    back: isDarkMode ? "bg-gradient-to-bl from-pink-900/20 to-[#22221F] border-pink-900/30" : "bg-gradient-to-bl from-pink-50 via-white to-pink-50/40 border-pink-100",
                    backTag: isDarkMode ? "text-pink-300 bg-pink-900/30 border-pink-800/50" : "text-pink-600 bg-pink-100/50 border-pink-200",
                    backAccent: "from-pink-200/40"
                  }
                ];
                const theme = cardThemes[currentCardIndex % 4];

                return (
                <div className="space-y-6">
                  <div className={\`flex items-center justify-between p-6 rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.05)] border transition-colors \${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-[#E0E0D5]"}\`}>
                    <div>
                      <h3 className={\`font-serif text-2xl \${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}\`}>Concept Flashcards</h3>
                      <p className={\`text-sm mt-1 \${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}\`}>Review key terminology and concepts</p>
                    </div>
                    <div className={\`text-xs font-semibold py-2 px-4 rounded-full \${isDarkMode ? "bg-[#282824] text-[#C2C2B0]" : "bg-[#F0F0E8] text-[#5A5A40]"}\`}>
                      Progress: {currentCardIndex + 1} / {flashcards.length}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={\`w-full h-1.5 rounded-full overflow-hidden \${isDarkMode ? "bg-[#383832]" : "bg-[#E0E0D5]"}\`}>
                    <div 
                      className="bg-[#5A5A40] h-full transition-all duration-300"
                      style={{ width: \`\${((currentCardIndex + 1) / flashcards.length) * 100}%\` }}
                    />
                  </div>

                  {/* Interactive Flashcard with Flip Animation */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="group cursor-pointer perspective-1000 w-full max-w-2xl mx-auto h-96 relative focus:outline-none"
                  >
                    <div className={\`relative w-full h-full duration-500 transform-style-3d transition-transform \${isFlipped ? 'rotate-y-180' : ''}\`}>
                      
                      {/* Front Side */}
                      <div className={\`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-12 flex flex-col items-center justify-center text-center transition-all \${theme.front} \${isDarkMode ? "shadow-black/40" : "shadow-[0_12px_40px_rgba(90,90,64,0.08)]"}\`}>
                        <div className="absolute inset-0 rounded-[24px] border border-white/50 pointer-events-none mix-blend-overlay"></div>
                        <div className={\`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm \${theme.frontTag}\`}>
                          Term / Concept
                        </div>
                        
                        {/* Decorative element */}
                        <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl \${theme.frontAccent} to-transparent rounded-tr-[24px] pointer-events-none\`}></div>

                        <span className={\`text-3xl md:text-5xl font-serif font-bold leading-tight px-4 select-none drop-shadow-sm \${isDarkMode ? "text-[#F5F5F0]" : "text-[#2D2D2A]"}\`}>
                          {flashcards[currentCardIndex].term}
                        </span>
                        <div className="absolute bottom-8 flex flex-col items-center">
                          <div className={\`w-8 h-1 rounded-full mb-3 opacity-50 \${isDarkMode ? "bg-[#383832]" : "bg-[#D1D1C4]"}\`}></div>
                          <span className="text-xs text-[#8A8A7A] font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                            Click card to reveal definition
                          </span>
                        </div>
                      </div>

                      {/* Back Side */}
                      <div className={\`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-10 flex flex-col items-center justify-center text-center rotate-y-180 transition-all \${theme.back} \${isDarkMode ? "shadow-black/40" : "shadow-[0_12px_40px_rgba(90,90,64,0.08)]"}\`}>
                        <div className="absolute inset-0 rounded-[24px] border border-white/60 pointer-events-none mix-blend-overlay"></div>
                        <div className={\`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm \${theme.backTag}\`}>
                          Definition / Explanation
                        </div>

                        {/* Decorative element */}
                        <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl \${theme.backAccent} to-transparent rounded-tr-[24px] pointer-events-none\`}></div>

                        <div className="flex-1 flex items-center justify-center w-full overflow-y-auto no-scrollbar py-6">
                          <p className={\`text-lg md:text-xl font-medium leading-relaxed max-w-xl px-4 select-none \${isDarkMode ? "text-[#E0E0D5]" : "text-[#4A4A3F]"}\`}>
                            {flashcards[currentCardIndex].definition}
                          </p>
                        </div>
                        
                        <div className="absolute bottom-8 flex flex-col items-center">
                          <div className={\`w-8 h-1 rounded-full mb-3 opacity-50 \${isDarkMode ? "bg-[#4A4A3F]" : "bg-[#D1D1C4]"}\`}></div>
                          <span className="text-xs text-[#8A8A7A] font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                            Click card to show term
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Controls */}`;

content = content.replace(regex, replacement);

const footerRegex = /\{\/\* Navigation Controls \*\/\}(.|\n)*?<\/div>\n\s*\}\)/g;
content = content.replace(/\n\s*\{\/\* Navigation Controls \*\/\}(.|\n)*?<\/div>\n\s*\}/g, (match) => {
   return match.replace(/<\/div>\n\s*\}$/, '</div>\n              )})();\n            }');
});

// Since the above might be tricky with regex let's just do an exact replace if the above fails.
fs.writeFileSync('src/App.tsx', content);
console.log("Replaced!");
