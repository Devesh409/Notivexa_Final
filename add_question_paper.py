import re

with open("server.ts", "r") as f:
    content = f.read()

target = """    } else if (questionType === "long") {
      typeInstructions = `## SECTION 1: DEEP LONG ANSWER QUESTIONS & VISUAL DIAGRAMS${bloomInstructions}
      Provide EXACTLY 50 complex, extensive, multi-part essay or problem questions. EACH question must be a comprehensive 8-mark question, requiring in-depth explanation, structured breakdown, and extensive detail.
      For EACH long-answer question, you MUST provide:
      1. A detailed, structured step-by-step breakdown explaining the underlying concepts deeply.
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).`;
    } else {"""

replacement = """    } else if (questionType === "long") {
      typeInstructions = `## SECTION 1: DEEP LONG ANSWER QUESTIONS & VISUAL DIAGRAMS${bloomInstructions}
      Provide EXACTLY 50 complex, extensive, multi-part essay or problem questions. EACH question must be a comprehensive 8-mark question, requiring in-depth explanation, structured breakdown, and extensive detail.
      For EACH long-answer question, you MUST provide:
      1. A detailed, structured step-by-step breakdown explaining the underlying concepts deeply.
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).`;
    } else if (questionType === "paper-full") {
      typeInstructions = `## FULL EXAM QUESTION PAPER${bloomInstructions}
      Generate a comprehensive and well-structured Question Paper covering the provided material. The paper MUST be divided into the following sections:
      
      ### SECTION A: MULTIPLE CHOICE QUESTIONS (MCQs) (1 Mark Each)
      Provide 10 high-quality MCQs covering key concepts.
      Format:
      **Q1. [Question]**
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D]
      **Correct Answer**: [Correct Option]
      
      ### SECTION B: SHORT ANSWER QUESTIONS (2, 3, and 4 Marks)
      Provide 9 Short Answer questions designed to test comprehension and explanation:
      - Three 2-Mark Questions (Requires 2-3 sentences)
      - Three 3-Mark Questions (Requires a short paragraph or bullet points)
      - Three 4-Mark Questions (Requires detailed explanation and examples)
      Format:
      **Q[X]. [Question] ([Y] Marks)**
      *Sample Answer*: [Provide the expected answer]

      ### SECTION C: LONG ANSWER QUESTIONS (5, 8, and 10 Marks)
      Provide 6 Long Answer questions testing deep understanding, analysis, and mechanics:
      - Two 5-Mark Questions (Requires structured paragraphs)
      - Two 8-Mark Questions (Requires deep dive, multi-part breakdown, or step-by-step explanation)
      - Two 10-Mark Questions (Requires comprehensive essay-style breakdown, extensive detail, and ideally a Mermaid.js diagram to illustrate)
      Format:
      **Q[X]. [Question] ([Y] Marks)**
      *Sample Answer Breakdown*: [Detailed response]`;
    } else if (questionType === "paper-mcq") {
      typeInstructions = `## EXAM QUESTION PAPER: MULTIPLE CHOICE (1 Mark Each)${bloomInstructions}
      Provide EXACTLY 30 MCQs formatted for an exam paper.
      Format:
      **Q1. [Question] (1 Mark)**
      A) [Option]
      B) [Option]
      C) [Option]
      D) [Option]
      
      **Correct Answer**: [Correct Option]`;
    } else if (questionType === "paper-short") {
      typeInstructions = `## EXAM QUESTION PAPER: SHORT ANSWER QUESTIONS${bloomInstructions}
      Provide exactly 15 Short Answer questions tailored for a structured exam paper, divided as follows:
      - Five 2-Mark Questions
      - Five 3-Mark Questions
      - Five 4-Mark Questions
      
      Format:
      **Q1. [Question] (X Marks)**
      *Sample Ideal Answer*: [Crisp, well-structured answer paragraph]`;
    } else if (questionType === "paper-long") {
      typeInstructions = `## EXAM QUESTION PAPER: LONG ANSWER QUESTIONS${bloomInstructions}
      Provide exactly 9 Long Answer / Essay type questions designed for a major exam section, divided as follows:
      - Three 5-Mark Questions (structured paragraphs)
      - Three 8-Mark Questions (in-depth analysis, multi-part)
      - Three 10-Mark Questions (comprehensive, extensive detail, requiring visual diagram)
      
      Format:
      **Q1. [Question] (X Marks)**
      *Sample Answer Breakdown*: [Extensive detail, step-by-step breakdown. For 10-Mark questions, include a Mermaid diagram block]`;
    } else {"""

content = content.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(content)
print("Updated server.ts")
