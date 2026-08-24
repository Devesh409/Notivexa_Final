import re

with open("server.ts", "r") as f:
    content = f.read()

target = '} else if (questionType === "paper-mcq") {'
replacement = """} else if (questionType === "paper-university") {
      typeInstructions = `## UNIVERSITY EXAM QUESTION PAPER FORMAT (60 MARKS)${bloomInstructions}
      Generate a formal university-style exam question paper based on the provided material.
      You MUST format the entire response using Markdown tables (with a header block above it).

      ### HEADER
      Write the following at the top (fill in the bracketed info based on the topic):
      **PILLAI HOC COLLEGE OF ENGINEERING & TECHNOLOGY, RASAYANI**
      **(Autonomous) (Accredited 'A+' by NAAC)**
      **PRELIMINARY SH 2025 EXAMINATION**
      **Department of Computer Application**
      
      **Branch:** [Infer from topic] (MCA) | **Semester:** [Infer]
      **Subject:** [Infer from topic] | **Time:** 02.00 Hours
      **Max. Marks:** 60 | **Date:** [Current Date]
      **Subject Code:** [Generate a plausible code]

      **N.B**
      1. Q.1 is compulsory
      2. Attempt any Three from the remaining five questions
      3. Each Question carry 15 marks.

      ### PAPER FORMAT (Use Markdown Table)
      Create a single markdown table representing the entire question paper with these exact columns:
      | Q.No | Question | M | BT | CO |
      
      (M = Marks, BT = Bloom's Taxonomy Level 1-6, CO = Course Outcome 1-6)

      - **Q.1 (Compulsory - Attempt any 3, 5 marks each = 15 Marks total):**
        - Provide sub-questions a), b), c), d).
      - **Q.2 to Q.6 (Attempt any 3, 15 marks each):**
        - For each question (Q.2, Q.3, Q.4, Q.5, Q.6), provide either:
          - 3 sub-questions (a, b, c) worth 5 marks each (5, 5, 5).
          - OR 2 sub-questions (a, b) worth 8 and 7 marks respectively.
        - Ensure a good mix of BT levels (e.g., 1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create) and map them to appropriate COs.

      **CRITICAL TABLE FORMATTING RULE:**
      Do NOT use Markdown rowspan or colspan as they are not supported. For main questions, leave M, BT, and CO blank. Example:
      | Q.1 | **Attempt any 3** | | | |
      | a) | [Question text] | 5 | 2 | 1 |
      | b) | [Question text] | 5 | 6 | 4 |

      ### FOOTER
      Below the table, provide the definitions for the COs (CO1 to CO6 related to the subject matter) and BT levels (BT Levels: 1 Remembering, 2 Understanding, 3 Applying, 4 Analyzing, 5 Evaluating, 6 Creating).
      `;
    } else if (questionType === "paper-mcq") {"""

content = content.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(content)

print("Added paper-university to server.ts")
