import re
with open("server.ts", "r") as f:
    text = f.read()

new_prompt_logic = """    const ai = getGenAI();
    
    let lengthInstructions = "1. Generate a highly detailed, chapter-wise summary of the provided text.\\n      2. For each chapter, provide an extremely comprehensive summary. Break down every single concept, theory, and example discussed.";
    if (summaryLength === "exhaustive_50_pages") {
        lengthInstructions = "1. EXHAUSTIVE SUMMARY REQUIRED: Generate an extremely long, exhaustive, minimum 50+ pages equivalent summary of the provided e-book.\\n      2. You MUST cover EVERY SINGLE chapter, sub-chapter, section, paragraph, and concept in excruciating detail. Do NOT skip anything.\\n      3. Provide extensive explanations, exhaustive examples, deep theoretical breakdowns, and all relevant formulas or code snippets.\\n      4. Keep generating until you hit the maximum token limit. The output must be as massively detailed as possible to simulate a 50+ page output.";
    } else if (summaryLength === "comprehensive") {
        lengthInstructions = "1. Generate a comprehensive, chapter-wise summary of the provided text.\\n      2. Break down every concept, theory, and example discussed thoroughly.";
    }

    const prompt = `
      You are an expert teacher and exam notes writer. I have provided a book or study material."""

text = text.replace("    const ai = getGenAI();\n    \n    const prompt = `\n      You are an expert teacher and exam notes writer. I have provided a book or study material.", new_prompt_logic)

with open("server.ts", "w") as f:
    f.write(text)
