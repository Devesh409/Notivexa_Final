import re

with open("server.ts", "r") as f:
    content = f.read()

target_full = """      ### SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs) (1 Mark Each)
      Provide 10 high-quality MCQs covering key concepts."""
replacement_full = """      ### SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs) (1 Mark Each)
      Provide exactly 30 high-quality MCQs covering key concepts."""
content = content.replace(target_full, replacement_full)

target_short = """      ### SECTION B: SHORT ANSWER QUESTIONS (2, 3, and 4 Marks)
      Provide 9 Short Answer questions designed to test comprehension and explanation:
      - Three 2-Mark Questions (Requires 2-3 sentences)
      - Three 3-Mark Questions (Requires a short paragraph or bullet points)
      - Three 4-Mark Questions (Requires detailed explanation and examples)"""
replacement_short = """      ### SECTION B: SHORT ANSWER QUESTIONS (2, 3, and 4 Marks)
      Provide exactly 12 Short Answer questions designed to test comprehension and explanation:
      - Four 2-Mark Questions
      - Four 3-Mark Questions
      - Four 4-Mark Questions"""
content = content.replace(target_short, replacement_short)

target_long = """      ### SECTION C: LONG ANSWER QUESTIONS (5, 8, and 10 Marks)
      Provide 6 Long Answer questions testing deep understanding, analysis, and mechanics:
      - Two 5-Mark Questions (Requires structured paragraphs)
      - Two 8-Mark Questions (Requires deep dive, multi-part breakdown, or step-by-step explanation)
      - Two 10-Mark Questions (Requires comprehensive essay-style breakdown, extensive detail, and ideally a Mermaid.js diagram to illustrate)"""
replacement_long = """      ### SECTION C: LONG ANSWER QUESTIONS (5, 8, and 10 Marks)
      Provide exactly 8 Long Answer questions testing deep understanding, analysis, and mechanics:
      - Three 5-Mark Questions
      - Three 8-Mark Questions
      - Two 10-Mark Questions"""
content = content.replace(target_long, replacement_long)

target_mcq_paper = """Provide EXACTLY 30 MCQs formatted for an exam paper."""
replacement_mcq_paper = """Provide EXACTLY 50 MCQs formatted for an exam paper."""
content = content.replace(target_mcq_paper, replacement_mcq_paper)

target_short_paper = """Provide exactly 15 Short Answer questions tailored for a structured exam paper, divided as follows:
      - Five 2-Mark Questions
      - Five 3-Mark Questions
      - Five 4-Mark Questions"""
replacement_short_paper = """Provide exactly 50 Short Answer questions tailored for a structured exam paper, divided as follows:
      - Twenty 2-Mark Questions
      - Fifteen 3-Mark Questions
      - Fifteen 4-Mark Questions"""
content = content.replace(target_short_paper, replacement_short_paper)

target_long_paper = """Provide exactly 9 Long Answer / Essay type questions designed for a major exam section, divided as follows:
      - Three 5-Mark Questions (structured paragraphs)
      - Three 8-Mark Questions (in-depth analysis, multi-part)
      - Three 10-Mark Questions (comprehensive, extensive detail, requiring visual diagram)"""
replacement_long_paper = """Provide exactly 50 Long Answer / Essay type questions designed for a major exam section, divided as follows:
      - Twenty 5-Mark Questions (structured paragraphs)
      - Fifteen 8-Mark Questions (in-depth analysis, multi-part)
      - Fifteen 10-Mark Questions (comprehensive, extensive detail, requiring visual diagram)"""
content = content.replace(target_long_paper, replacement_long_paper)

with open("server.ts", "w") as f:
    f.write(content)

print("Updated server.ts prompts")
