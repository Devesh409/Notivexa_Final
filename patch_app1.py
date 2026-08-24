with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'const [examPaperType, setExamPaperType] = useState("paper-full");',
    'const [examPaperType, setExamPaperType] = useState("paper-full");\n    const [universityMarks, setUniversityMarks] = useState<number>(60);'
)

with open("src/App.tsx", "w") as f:
    f.write(content)
