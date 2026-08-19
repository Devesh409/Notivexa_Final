const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startStr = '// 6. Generate Comprehensive Question Bank';
const endStr = '});\n\n// Global Error Handler';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newRoute = `// 6. Generate Comprehensive Question Bank
app.post("/api/generate-question-bank", async (req, res) => {
  try {
    const { fileUri, mimeType, questionType = "all" } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();
    
    let typeInstructions = "";
    if (questionType === "mcq") {
      typeInstructions = \`## SECTION 1: MULTIPLE CHOICE QUESTIONS (MCQs)
      Provide EXACTLY 50 rigorous, high-quality MCQs covering key concepts.
      Format:
      - **Q1.** [Question body]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        **Correct Answer**: [Correct Option]
        *Explanation*: [Brief explanation of why it's correct]\`;
    } else if (questionType === "blanks") {
      typeInstructions = \`## SECTION 1: FILL IN THE BLANKS
      Provide EXACTLY 50 Fill-in-the-Blank statements that test core vocabulary, formulas, and facts.
      Format:
      - **Q1.** [Statement with a blank: "_______"]
        **Answer**: [Correct Word/Phrase]
        *Explanation*: [Brief context]\`;
    } else if (questionType === "truefalse") {
      typeInstructions = \`## SECTION 1: TRUE OR FALSE
      Provide EXACTLY 50 conceptually challenging True/False statements.
      Format:
      - **Q1.** [Statement]
        **Answer**: [True / False]
        *Explanation*: [In-depth proof/reasoning]\`;
    } else if (questionType === "short") {
      typeInstructions = \`## SECTION 1: SHORT ANSWER QUESTIONS
      Provide EXACTLY 50 precise short-answer questions focusing on essential mechanics or definitions.
      Format:
      - **Q1.** [Question]
        **Sample Ideal Answer**: [Crisp, high-scoring answer paragraph, typically 2-4 sentences]\`;
    } else if (questionType === "long") {
      typeInstructions = \`## SECTION 1: DEEP LONG ANSWER QUESTIONS & VISUAL DIAGRAMS
      Provide EXACTLY 50 complex, extensive, multi-part essay or problem questions requiring in-depth explanation.
      For EACH long-answer question, you MUST provide:
      1. A detailed, structured step-by-step breakdown explaining the underlying concepts deeply.
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).\`;
    } else {
      typeInstructions = \`## SECTION 1: MULTIPLE CHOICE QUESTIONS (MCQs)
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
      2. A relevant, highly detailed visual schematic or flow diagram written using Mermaid.js syntax inside a markdown mermaid block for at least the first 5 questions (you can skip diagrams for the remaining 45 to save space).\`;
    }

    const prompt = \`
      You are an elite educational AI developer and domain-expert professor. Create a highly professional, comprehensive and pedagogical **Question Bank with Complete Solutions** based on the provided learning materials.

      CRITICAL INSTRUCTION: You MUST generate EXACTLY 50 unique questions for EACH section requested below. 
      Ensure that NO questions are repeated across or within sections. Provide exact answers and explanations for every single question. DO NOT add any extra questions beyond the 50 per section.

      Your generated Question Bank MUST strictly include the following structured sections:

      # 📚 EXAM QUESTION BANK & SOLUTIONS

      \${typeInstructions}

      CRITICAL MERMAID RULES:
      - Always enclose node labels in double quotes, e.g. A["Process Step"] or Start("Start Point").
      - NEVER use double quotes or pipes INSIDE a node label. Use single quotes if needed.
      - Each Mermaid statement or arrow MUST be on its own separate line.

      CRITICAL FORMAT RULE:
      - STRICTLY DO NOT use arrows (e.g. ->, -->, =>) in plain text. Use clean numbered list items or headers. Arrows are ONLY allowed inside Mermaid syntax blocks.
    \`;
    
    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-2.5-pro",
        contents: await getContentParts(fileUri, mimeType, prompt)
      });
      return res.json({ result: response.text });
    } catch (error: any) {
      console.error("Question Bank error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Question Bank outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
`;
    code = code.substring(0, startIndex) + newRoute + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Success");
} else {
    console.log("Not found endpoints");
}
