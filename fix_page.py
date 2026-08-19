import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                      ))}
                    </div>
                  )}
                </div>"""

replacement = """                      ))}
                    </div>
                  )}
                  {(mode === 'student') && resultType !== 'ppt' && (
                    <div className={`absolute bottom-6 left-12 text-xs font-semibold ${penColor === 'blue' ? 'text-[#3b82f6]' : 'text-gray-400'}`}>
                      Page 1
                    </div>
                  )}
                </div>"""

text = text.replace(target, replacement)

target2 = """                  className={`prose max-w-none page-break-before exam-paper-table ${(mode === 'student') && resultType !== 'ppt' ? `${handwritingFont} text-xl bg-white p-10 rounded-sm relative` : 'font-sans text-[#4A4A3F] p-10'}`"""
replacement2 = """                  className={`prose max-w-none page-break-before exam-paper-table ${(mode === 'student') && resultType !== 'ppt' ? `${handwritingFont} text-xl bg-white p-10 pb-16 rounded-sm relative` : 'font-sans text-[#4A4A3F] p-10'}`"""

text = text.replace(target2, replacement2)

with open("src/App.tsx", "w") as f:
    f.write(text)
