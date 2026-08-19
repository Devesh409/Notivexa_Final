const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPromptStart = `      You are an elite educational AI developer and domain-expert professor. Create a highly professional, comprehensive and pedagogical **Question Bank with Complete Solutions** based on the provided learning materials.`;
const oldPromptEnd = `      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block. Recreate the structural interaction or timeline visually!`;

const startIdx = code.indexOf(oldPromptStart);
const endIdx = code.indexOf(oldPromptEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = `      You are an elite educational AI developer and domain-expert professor. Create a highly professional, comprehensive and pedagogical **Question Bank with Complete Solutions** based on the provided learning materials.

      CRITICAL INSTRUCTION: You MUST generate EXACTLY 50 unique questions for EACH section. 
      Ensure that NO questions are repeated across or within sections. Provide exact answers and explanations for every single question. DO NOT add any extra questions beyond the 50 per section.

      Your generated Question Bank MUST strictly include the following structured sections:

      # 📚 EXAM QUESTION BANK & SOLUTIONS

      ## SECTION 1: MULTIPLE CHOICE QUESTIONS (MCQs)
      Provide EXACTLY 50 rigorous, high-quality MCQs covering key concepts.
      Format:
      - **Q1.** [Question body]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        **Correct Answer**: [Correct Option]
        *Explanation*: [Brief explanation of why it's correct]

      ## SECTION 2: FILL IN THE BLANKS
      Provide EXACTLY 50 Fill-in-the-Blank statements that test core vocabulary, formulas, and facts.
      Format:
      - **Q1.** [Statement with a blank: "_______"]
        **Answer**: [Correct Word/Phrase]
        *Explanation*: [Brief context]

      ## SECTION 3: TRUE OR FALSE
      Provide EXACTLY 50 conceptually challenging True/False statements.
      Format:
      - **Q1.** [Statement]
        **Answer**: [True / False]
        *Explanation*: [In-depth proof/reasoning]

      ## SECTION 4: SHORT ANSWER QUESTIONS
      Provide EXACTLY 50 precise short-answer questions focusing on essential mechanics or definitions.
      Format:
      - **Q1.** [Question]
        **Sample Ideal Answer**: [Crisp, high-scoring answer paragraph, typically 2-4 sentences]

      ## SECTION 5: DEEP LONG ANSWER QUESTIONS & VISUAL DIAGRAMS
      Provide EXACTLY 50 complex, extensive, multi-part essay or problem questions requiring in-depth explanation.
      For EACH long-answer question, you MUST provide:
      1. A detailed, structured step-by-step breakdown explaining the underlying concepts deeply.
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).`;
    
    code = code.substring(0, startIdx) + newContent + code.substring(endIdx + oldPromptEnd.length);
    fs.writeFileSync('server.ts', code);
    console.log("Success");
} else {
    console.log("Not found");
}
