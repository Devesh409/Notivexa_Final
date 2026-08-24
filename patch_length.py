import re

with open("server.ts", "r") as f:
    content = f.read()

old_length = """        let lengthInstructions = `CRITICAL MANDATORY REQUIREMENT: You MUST generate a summary that spans a minimum of 100 distinct pages. 
      To achieve this, you MUST output the EXACT string "---PAGE_BREAK---" on a new line very frequently (e.g., after every 2-3 sentences or after every single bullet point). 
      You MUST NOT stop generating until you have outputted the "---PAGE_BREAK---" marker at least 100 times. 
      To fill this volume, you must stretch the content: provide extreme levels of detail, exhaustive step-by-step breakdowns, countless real-world examples, historical context, trivia, practice questions, and deep-dive analysis of every single concept mentioned in the file.
      Count your pages internally. Do not conclude the summary until you have reached 100 pages.`;"""

new_length = """        let lengthInstructions = `Generate a highly comprehensive and detailed summary of the provided text.
      Break the summary into logical pages using the "---PAGE_BREAK---" marker between major sections or topics.
      Aim for a highly detailed 5 to 10 page summary, providing step-by-step breakdowns, examples, and deep-dive analysis.
      Do not exceed the token limits, but provide as much detail as possible.`;"""

content = content.replace(old_length, new_length)

with open("server.ts", "w") as f:
    f.write(content)
