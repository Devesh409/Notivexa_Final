const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Flashcards View \*\/\}(.|\n)*?\{\/\* Navigation Controls \*\/\}/g;

const flashcardsCode = `              {/* Flashcards View */}
              {flashcards.length > 0 && (
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
                      <div className={\`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-12 flex flex-col items-center justify-center text-center transition-all \${isDarkMode ? "bg-gradient-to-br from-[#22221F] to-[#1A1A17] border-[#383832] shadow-black/40" : "bg-gradient-to-br from-white via-[#FDFDFB] to-[#F5F5F0] border-[#E0E0D5] shadow-[0_12px_40px_rgba(90,90,64,0.08)]"}\`}>
                        <div className="absolute inset-0 rounded-[24px] border border-white/50 pointer-events-none mix-blend-overlay"></div>
                        <div className={\`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm \${isDarkMode ? "text-[#A1A194] bg-[#2A2A26] border-[#383832]" : "text-amber-700 bg-amber-50 border-amber-100"}\`}>
                          Term / Concept
                        </div>
                        
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-tr-[24px] pointer-events-none"></div>

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
                      <div className={\`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-10 flex flex-col items-center justify-center text-center rotate-y-180 transition-all \${isDarkMode ? "bg-gradient-to-br from-[#2A2A26] to-[#22221F] border-[#383832] shadow-black/40" : "bg-gradient-to-bl from-[#FAF9F6] via-[#FDFDFB] to-white border-[#E0E0D5] shadow-[0_12px_40px_rgba(90,90,64,0.08)]"}\`}>
                        <div className="absolute inset-0 rounded-[24px] border border-white/60 pointer-events-none mix-blend-overlay"></div>
                        <div className={\`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm \${isDarkMode ? "text-[#C2C2B0] bg-[#383832] border-[#4A4A3F]" : "text-emerald-700 bg-emerald-50 border-emerald-100"}\`}>
                          Definition / Explanation
                        </div>

                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/30 to-transparent rounded-tr-[24px] pointer-events-none"></div>

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

content = content.replace(regex, flashcardsCode);
fs.writeFileSync('src/App.tsx', content);
console.log("Replaced!");
