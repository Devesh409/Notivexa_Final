import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Inside generateExamPaper, we need to find the `setResultType` lines.
# But `setResultType("question-bank")` appears in generateQuestionBank as well.
# Let's target the exact string block for generateExamPaper.
ep_start = content.find('const generateExamPaper = async () => {')
ep_end = content.find('const generatePPT = async () => {')

ep_block = content[ep_start:ep_end]
ep_block = ep_block.replace('setResultType("question-bank");', 'setResultType("exam-paper");')

content = content[:ep_start] + ep_block + content[ep_end:]

# Now let's update the Markdown rendering style logic to bypass student mode handwriting if resultType === "exam-paper"
# Target:
# <div 
#   ref={notesRef}
#   className={`prose max-w-none page-break-before exam-paper-table mx-auto bg-white shadow-xl ${(mode === 'student') && true ? `${handwritingFont} text-xl p-10 pb-16 rounded-sm relative` : 'font-sans text-[#4A4A3F] p-10 relative'}`}

target_class = "className={`prose max-w-none page-break-before exam-paper-table mx-auto bg-white shadow-xl ${(mode === 'student') && true ? `${handwritingFont} text-xl p-10 pb-16 rounded-sm relative` : 'font-sans text-[#4A4A3F] p-10 relative'}`}"
replacement_class = "className={`prose max-w-none page-break-before exam-paper-table mx-auto bg-white shadow-xl ${(mode === 'student' && resultType !== 'exam-paper') ? `${handwritingFont} text-xl p-10 pb-16 rounded-sm relative` : 'font-sans text-[#4A4A3F] p-10 relative'}`}"
content = content.replace(target_class, replacement_class)

target_style = "}, (mode === 'student') && true ? {"
replacement_style = "}, (mode === 'student' && resultType !== 'exam-paper') ? {"
content = content.replace(target_style, replacement_style)

# Also fix the ReactMarkdown components!
target_components = "components={{"
target_table = "table: ({node, ...props}) => <div className=\"overflow-x-auto my-4 w-full\"><table className={`w-full border-collapse ${mode === 'student' ? `border-2 border-opacity-20 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} /></div>,"
replacement_table = "table: ({node, ...props}) => <div className=\"overflow-x-auto my-4 w-full\"><table className={`w-full border-collapse ${(mode === 'student' && resultType !== 'exam-paper') ? `border-2 border-opacity-20 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} /></div>,"
content = content.replace(target_table, replacement_table)

target_th = "th: ({node, ...props}) => <th className={`p-2 text-left ${mode === 'student' ? `border-b-2 border-opacity-20 bg-transparent font-bold text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,"
replacement_th = "th: ({node, ...props}) => <th className={`p-2 text-left ${(mode === 'student' && resultType !== 'exam-paper') ? `border-b-2 border-opacity-20 bg-transparent font-bold text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,"
content = content.replace(target_th, replacement_th)

target_td = "td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"
replacement_td = "td: ({node, ...props}) => <td className={`p-2 ${(mode === 'student' && resultType !== 'exam-paper') ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"
content = content.replace(target_td, replacement_td)

target_background = "{(mode === 'student') && true && ("
replacement_background = "{(mode === 'student' && resultType !== 'exam-paper') && ("
content = content.replace(target_background, replacement_background)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Updated App.tsx")
