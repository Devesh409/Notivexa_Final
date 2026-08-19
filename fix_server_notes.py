import re
with open("server.ts", "r") as f:
    text = f.read()

text = text.replace("const { fileUri, mimeType, focusArea, mode } = req.body;", "const { fileUri, mimeType, focusArea, mode, summaryLength } = req.body;")

new_prompt_logic = """
    let lengthInstructions = "1. Generate a highly detailed, chapter-wise summary of the provided text.\\n      2. For each chapter, provide an extremely comprehensive summary. Break down every single concept, theory, and example discussed.";
    if (summaryLength === "exhaustive_50_pages") {
        lengthInstructions = "1. EXHAUSTIVE SUMMARY REQUIRED: Generate an extremely long, exhaustive, minimum 50+ pages equivalent summary of the provided e-book.\\n      2. You MUST cover EVERY SINGLE chapter, sub-chapter, section, paragraph, and concept in excruciating detail. Do NOT skip anything.\\n      3. Provide extensive explanations, exhaustive examples, deep theoretical breakdowns, and all relevant formulas or code snippets.\\n      4. Keep generating until you hit the maximum token limit. The output must be as massively detailed as possible to simulate a 50+ page output.";
    } else if (summaryLength === "comprehensive") {
        lengthInstructions = "1. Generate a comprehensive, chapter-wise summary of the provided text.\\n      2. Break down every concept, theory, and example discussed thoroughly.";
    }
"""

target = """    const ai = getGenAI();
    
    const prompt = `
      You are an expert teacher and exam notes writer. I have provided a book or study material."""
replacement = """    const ai = getGenAI();
""" + new_prompt_logic + """
    const prompt = `
      You are an expert teacher and exam notes writer. I have provided a book or study material."""
text = text.replace(target, replacement)

target2 = """      Tasks:
      1. Generate a highly detailed, chapter-wise summary of the provided text.
      2. For each chapter, provide an extremely comprehensive summary. Break down every single concept, theory, and example discussed.
      3. Convert the content into structured, step-by-step study notes suitable for a student."""

replacement2 = """      Tasks:
      ${lengthInstructions}
      3. Convert the content into structured, step-by-step study notes suitable for a student."""
text = text.replace(target2, replacement2)

with open("server.ts", "w") as f:
    f.write(text)
