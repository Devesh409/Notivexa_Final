import re

with open("src/App.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const generateExamPaper = async () => {" in line:
        print(f"generateExamPaper starts at {i}")
    if "const downloadCSV = () => {" in line:
        print(f"downloadCSV at {i}")

