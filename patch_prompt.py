import re

with open("server.ts", "r") as f:
    content = f.read()

old_length = """        let lengthInstructions = `1. Generate an EXHAUSTIVE summary. You MUST output at least 100 distinct pages. 
      2. To achieve this within token limits, insert the EXACT string "---PAGE_BREAK---" on a new line VERY FREQUENTLY (e.g., after every 50-80 words or every single major bullet point).
      3. Do NOT stop until you have generated at least 100 "---PAGE_BREAK---" markers. Keep expanding on the topic with extreme depth, examples, quizzes, and derivations until you hit the 100-page mark.`;"""

new_length = """        let lengthInstructions = `CRITICAL MANDATORY REQUIREMENT: You MUST generate a summary that spans a minimum of 100 distinct pages. 
      To achieve this, you MUST output the EXACT string "---PAGE_BREAK---" on a new line very frequently (e.g., after every 2-3 sentences or after every single bullet point). 
      You MUST NOT stop generating until you have outputted the "---PAGE_BREAK---" marker at least 100 times. 
      To fill this volume, you must stretch the content: provide extreme levels of detail, exhaustive step-by-step breakdowns, countless real-world examples, historical context, trivia, practice questions, and deep-dive analysis of every single concept mentioned in the file.
      Count your pages internally. Do not conclude the summary until you have reached 100 pages.`;"""

content = content.replace(old_length, new_length)

with open("server.ts", "w") as f:
    f.write(content)
