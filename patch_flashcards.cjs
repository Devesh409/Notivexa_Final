const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `              {/* Flashcards View */}
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
                    </div>`;

const replacement = `              {/* Flashcards View */}
              {flashcards.length > 0 && (() => {
                let cardThemes = [];
                if (flashcardThemeStyle === "monochrome") {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-neutral-800 to-neutral-950 border-neutral-700",
                      back: "bg-gradient-to-bl from-neutral-700 to-neutral-900 border-neutral-600",
                      tag: "text-neutral-200 bg-white/10 border-white/20 backdrop-blur-sm",
                      accent: "from-white/5",
                      text: "text-neutral-50",
                      textSecondary: "text-neutral-400",
                      divider: "bg-neutral-600"
                    }
                  ];
                } else if (flashcardThemeStyle === "pastel") {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-rose-100 to-pink-50 border-rose-200",
                      back: "bg-gradient-to-bl from-pink-50 to-rose-100 border-pink-200",
                      tag: "text-rose-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-rose-900",
                      textSecondary: "text-rose-600",
                      divider: "bg-rose-300"
                    },
                    {
                      front: "bg-gradient-to-br from-sky-100 to-blue-50 border-sky-200",
                      back: "bg-gradient-to-bl from-blue-50 to-sky-100 border-blue-200",
                      tag: "text-sky-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-sky-900",
                      textSecondary: "text-sky-600",
                      divider: "bg-sky-300"
                    },
                    {
                      front: "bg-gradient-to-br from-emerald-100 to-green-50 border-emerald-200",
                      back: "bg-gradient-to-bl from-green-50 to-emerald-100 border-green-200",
                      tag: "text-emerald-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-emerald-900",
                      textSecondary: "text-emerald-600",
                      divider: "bg-emerald-300"
                    },
                    {
                      front: "bg-gradient-to-br from-amber-100 to-yellow-50 border-amber-200",
                      back: "bg-gradient-to-bl from-yellow-50 to-amber-100 border-yellow-200",
                      tag: "text-amber-700 bg-black/5 border-black/10 backdrop-blur-sm",
                      accent: "from-white/40",
                      text: "text-amber-900",
                      textSecondary: "text-amber-600",
                      divider: "bg-amber-300"
                    }
                  ];
                } else if (flashcardThemeStyle === "high-contrast") {
                  cardThemes = [
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-yellow-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-yellow-500",
                      tag: "text-[#000000] bg-yellow-400 border-yellow-300 backdrop-blur-sm",
                      accent: "from-yellow-400/20",
                      text: "text-yellow-400",
                      textSecondary: "text-yellow-200",
                      divider: "bg-yellow-400"
                    },
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-cyan-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-cyan-500",
                      tag: "text-[#000000] bg-cyan-400 border-cyan-300 backdrop-blur-sm",
                      accent: "from-cyan-400/20",
                      text: "text-cyan-400",
                      textSecondary: "text-cyan-200",
                      divider: "bg-cyan-400"
                    },
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-magenta-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-magenta-500",
                      tag: "text-[#000000] bg-magenta-400 border-magenta-300 backdrop-blur-sm",
                      accent: "from-magenta-400/20",
                      text: "text-magenta-400",
                      textSecondary: "text-magenta-200",
                      divider: "bg-magenta-400"
                    },
                    {
                      front: "bg-gradient-to-br from-[#000000] to-[#1a1a1a] border-green-400",
                      back: "bg-gradient-to-bl from-[#1a1a1a] to-[#000000] border-green-500",
                      tag: "text-[#000000] bg-green-400 border-green-300 backdrop-blur-sm",
                      accent: "from-green-400/20",
                      text: "text-green-400",
                      textSecondary: "text-green-200",
                      divider: "bg-green-400"
                    }
                  ];
                } else {
                  cardThemes = [
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
                }
                const theme = cardThemes[currentCardIndex % cardThemes.length];

                return (
                  <div className="space-y-6">
                    <div className={\`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.05)] border transition-colors \${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-[#E0E0D5]"}\`}>
                      <div>
                        <h3 className={\`font-serif text-2xl \${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}\`}>Concept Flashcards</h3>
                        <p className={\`text-sm mt-1 \${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}\`}>Review key terminology and concepts</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <select 
                          value={flashcardThemeStyle}
                          onChange={(e) => setFlashcardThemeStyle(e.target.value as any)}
                          className={\`text-sm font-medium border rounded-full px-4 py-2 focus:outline-none transition-colors \${
                            isDarkMode 
                              ? "bg-[#282824] border-[#4A4A40] text-[#E0E0D5]" 
                              : "bg-[#F0F0E8] border-[#D1D1C4] text-[#5A5A40]"
                          }\`}
                        >
                          <option value="default">Default Theme</option>
                          <option value="monochrome">Monochrome Modern</option>
                          <option value="pastel">Soft Pastel</option>
                          <option value="high-contrast">High Contrast</option>
                        </select>
                        <div className={\`text-xs font-semibold py-2 px-4 rounded-full \${isDarkMode ? "bg-[#282824] text-[#C2C2B0]" : "bg-[#F0F0E8] text-[#5A5A40]"}\`}>
                          Progress: {currentCardIndex + 1} / {flashcards.length}
                        </div>
                      </div>
                    </div>`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Success");
} else {
  console.log("Could not find target1");
}
