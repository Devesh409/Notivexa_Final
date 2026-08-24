import re

with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "p: ({node, ...props}) => <p className={`mb-4 ${(mode === 'student' && resultType !== 'exam-paper') ? `text-inherit ${handwritingFont}` : 'text-blue-600'}`} {...props} />," in line:
        continue
    
    if "p: ({node, children, ...props}: any) => {" in line:
        line = line.replace(
            "p: ({node, children, ...props}: any) => {",
            "p: ({node, children, ...props}: any) => {\n                                const isStudent = mode === 'student' && resultType !== 'exam-paper';\n                                const pClass = `mb-4 ${isStudent ? `text-inherit ${handwritingFont}` : 'text-blue-600'}`;"
        )
    if "return <p {...props}>{children}</p>;" in line:
        line = line.replace(
            "return <p {...props}>{children}</p>;",
            "return <p className={pClass} {...props}>{children}</p>;"
        )

    new_lines.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(new_lines)

