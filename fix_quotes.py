import re
with open("server.ts", "r") as f:
    text = f.read()

target = '''    let lengthInstructions = "1. Generate a highly detailed, chapter-wise summary of the provided text.
      2. For each chapter, provide an extremely comprehensive summary. Break down every single concept, theory, and example discussed.";
    if (summaryLength === "exhaustive_50_pages") {
        lengthInstructions = "1. EXHAUSTIVE SUMMARY REQUIRED: Generate an extremely long, exhaustive, minimum 50+ pages equivalent summary of the provided e-book.
      2. You MUST cover EVERY SINGLE chapter, sub-chapter, section, paragraph, and concept in excruciating detail. Do NOT skip anything.
      3. Provide extensive explanations, exhaustive examples, deep theoretical breakdowns, and all relevant formulas or code snippets.
      4. Keep generating until you hit the maximum token limit. The output must be as massively detailed as possible to simulate a 50+ page output.";
    } else if (summaryLength === "comprehensive") {
        lengthInstructions = "1. Generate a comprehensive, chapter-wise summary of the provided text.
      2. Break down every concept, theory, and example discussed thoroughly.";
    }'''

replacement = '''    let lengthInstructions = `1. Generate a highly detailed, chapter-wise summary of the provided text.
      2. For each chapter, provide an extremely comprehensive summary. Break down every single concept, theory, and example discussed.`;
    if (summaryLength === "exhaustive_50_pages") {
        lengthInstructions = `1. EXHAUSTIVE SUMMARY REQUIRED: Generate an extremely long, exhaustive, minimum 50+ pages equivalent summary of the provided e-book.
      2. You MUST cover EVERY SINGLE chapter, sub-chapter, section, paragraph, and concept in excruciating detail. Do NOT skip anything.
      3. Provide extensive explanations, exhaustive examples, deep theoretical breakdowns, and all relevant formulas or code snippets.
      4. Keep generating until you hit the maximum token limit. The output must be as massively detailed as possible to simulate a 50+ page output.`;
    } else if (summaryLength === "comprehensive") {
        lengthInstructions = `1. Generate a comprehensive, chapter-wise summary of the provided text.
      2. Break down every concept, theory, and example discussed thoroughly.`;
    }'''

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
