const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStart = '{/* Interactive Flashcard with Flip Animation */}';
const targetEnd = '{/* Navigation Controls */}';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find targets");
  process.exit(1);
}

const replacement = `{/* Interactive Flashcard with Flip Animation */}
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

                  `;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

const wrapperStartTarget = '{/* Progress Bar */}';
const wrapperStart = content.indexOf(wrapperStartTarget);
if (wrapperStart !== -1) {
    const wrapCode = `(() => {
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
                      <div className="contents">
                        {/* Progress Bar */}`;
    content = content.substring(0, wrapperStart) + wrapCode + content.substring(wrapperStart + wrapperStartTarget.length);
}

const wrapperEndTarget = `Next &rarr;
                </button>
              </div>
            </div>
          )
          })()}`;

if (content.includes(wrapperEndTarget)) {
   content = content.replace(wrapperEndTarget, `Next &rarr;
                </button>
              </div>
            </div>
          </div>
          )
          })()}`);
} else {
   const backupEnd = `Next &rarr;
                </button>
              </div>
            </div>
          )})();}`;
   content = content.replace(backupEnd, `Next &rarr;
                </button>
              </div>
            </div>
          </div>
          )})();}`);
}


fs.writeFileSync('src/App.tsx', content);
console.log("Updated colors");
