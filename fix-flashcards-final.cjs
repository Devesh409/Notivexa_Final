const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Flashcards View \*\/\}(.|\n)*?\{\/\* Live Page Scanner Modal Overlay \*\/\}/g;

const flashcardsCode = `              {/* Flashcards View */}
              {flashcards.length > 0 && (() => {
                const cardThemes = [
                  {
                    front: "bg-gradient-to-br from-[#5A5A40] to-[#42422F] border-[#6A6A4D]",
                    back: "bg-gradient-to-bl from-[#4A4A35] to-[#363627] border-[#5A5A40]",
                    tag: "text-[#F5F5F0] bg-white/10 border-white/20 backdrop-blur-sm",
                    accent: "from-white/10",
                    text: "text-[#F5F5F0]",
                    textSecondary: "text-[#E0E0D5]",
                    divider: "bg-white/20"
                  },
                  {
                    front: "bg-gradient-to-br from-[#8C4A42] to-[#6A3630] border-[#A35950]",
                    back: "bg-gradient-to-bl from-[#7A403A] to-[#5C2E29] border-[#8C4A42]",
                    tag: "text-[#FDF3F2] bg-white/10 border-white/20 backdrop-blur-sm",
                    accent: "from-white/10",
                    text: "text-[#FDF3F2]",
                    textSecondary: "text-[#EBD6D3]",
                    divider: "bg-white/20"
                  },
                  {
                    front: "bg-gradient-to-br from-[#967035] to-[#755524] border-[#B08544]",
                    back: "bg-gradient-to-bl from-[#85622C] to-[#66491D] border-[#967035]",
                    tag: "text-[#FDF8F0] bg-white/10 border-white/20 backdrop-blur-sm",
                    accent: "from-white/10",
                    text: "text-[#FDF8F0]",
                    textSecondary: "text-[#EBE0C8]",
                    divider: "bg-white/20"
                  },
                  {
                    front: "bg-gradient-to-br from-[#3D5266] to-[#2B3C4D] border-[#4F677D]",
                    back: "bg-gradient-to-bl from-[#34485C] to-[#243342] border-[#3D5266]",
                    tag: "text-[#F0F2F5] bg-white/10 border-white/20 backdrop-blur-sm",
                    accent: "from-white/10",
                    text: "text-[#F0F2F5]",
                    textSecondary: "text-[#D1D6DF]",
                    divider: "bg-white/20"
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
                        <div className={\`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-12 flex flex-col items-center justify-center text-center transition-all \${theme.front} \${isDarkMode ? "shadow-black/40" : "shadow-[0_12px_40px_rgba(90,90,64,0.15)]"}\`}>
                          <div className="absolute inset-0 rounded-[24px] border border-white/20 pointer-events-none mix-blend-overlay"></div>
                          <div className={\`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm \${theme.tag}\`}>
                            Term / Concept
                          </div>
                          
                          {/* Decorative element */}
                          <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl \${theme.accent} to-transparent rounded-tr-[24px] pointer-events-none\`}></div>

                          <span className={\`text-3xl md:text-5xl font-serif font-bold leading-tight px-4 select-none drop-shadow-md \${theme.text}\`}>
                            {flashcards[currentCardIndex].term}
                          </span>
                          <div className="absolute bottom-8 flex flex-col items-center">
                            <div className={\`w-8 h-1 rounded-full mb-3 \${theme.divider}\`}></div>
                            <span className={\`text-xs font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity \${theme.textSecondary}\`}>
                              Click card to reveal definition
                            </span>
                          </div>
                        </div>

                        {/* Back Side */}
                        <div className={\`absolute inset-0 backface-hidden border rounded-[24px] shadow-xl p-10 flex flex-col items-center justify-center text-center rotate-y-180 transition-all \${theme.back} \${isDarkMode ? "shadow-black/40" : "shadow-[0_12px_40px_rgba(90,90,64,0.15)]"}\`}>
                          <div className="absolute inset-0 rounded-[24px] border border-white/20 pointer-events-none mix-blend-overlay"></div>
                          <div className={\`absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm \${theme.tag}\`}>
                            Definition / Explanation
                          </div>

                          {/* Decorative element */}
                          <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl \${theme.accent} to-transparent rounded-tr-[24px] pointer-events-none\`}></div>

                          <div className="flex-1 flex items-center justify-center w-full overflow-y-auto no-scrollbar py-6">
                            <p className={\`text-lg md:text-xl font-medium leading-relaxed max-w-xl px-4 select-none \${theme.text}\`}>
                              {flashcards[currentCardIndex].definition}
                            </p>
                          </div>
                          
                          <div className="absolute bottom-8 flex flex-col items-center">
                            <div className={\`w-8 h-1 rounded-full mb-3 \${theme.divider}\`}></div>
                            <span className={\`text-xs font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity \${theme.textSecondary}\`}>
                              Click card to show term
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between max-w-2xl mx-auto pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                          setTimeout(() => {
                            setCurrentCardIndex(prev => Math.max(0, prev - 1));
                          }, isFlipped ? 150 : 0);
                        }}
                        disabled={currentCardIndex === 0}
                        className="px-6 py-2.5 rounded-full border border-[#D1D1C4] text-[#5A5A40] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        &larr; Previous
                      </button>
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-xs text-[#8A8A7A] font-bold uppercase tracking-[0.1em] select-none">
                          Card {currentCardIndex + 1} of {flashcards.length}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFlipped(false);
                              setTimeout(() => {
                                setFlashcards(prev => {
                                  const shuffled = [...prev];
                                  for (let i = shuffled.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                                  }
                                  return shuffled;
                                });
                                setCurrentCardIndex(0);
                              }, isFlipped ? 150 : 0);
                            }}
                            className="text-xs font-semibold text-[#5A5A40] flex items-center gap-1.5 hover:text-[#3A3A2F] hover:bg-[#F0F0E8] px-3 py-1.5 rounded-full transition-colors"
                            title="Shuffle cards"
                          >
                            <Shuffle size={14} />
                            <span>Shuffle</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadCSV();
                            }}
                            className="text-xs font-semibold text-[#5A5A40] flex items-center gap-1.5 hover:text-[#3A3A2F] hover:bg-[#F0F0E8] px-3 py-1.5 rounded-full transition-colors"
                            title="Download as CSV for Anki/Quizlet"
                          >
                            <Download size={14} />
                            <span>CSV</span>
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                          setTimeout(() => {
                            setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                          }, isFlipped ? 150 : 0);
                        }}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="px-6 py-2.5 rounded-full bg-[#5A5A40] text-white hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                );
              })()}
          {resultType === "video" && videoData && (
            <VideoExplainer 
              videoData={videoData} 
              onClose={() => {
                setVideoData(null);
                setResultType("");
              }}
            />
          )}
        </div>
      </div>

      {/* Live Page Scanner Modal Overlay */}`;

content = content.replace(regex, flashcardsCode);
fs.writeFileSync('src/App.tsx', content);
console.log("Replaced cleanly!");
