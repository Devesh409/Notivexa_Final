import re

with open("server.ts", "r") as f:
    content = f.read()

# Update the prompt in generate-lesson-plan
prompt_match = re.search(r'(const prompt = `\n\s*You are an expert student success coach.*?)(CRITICAL FORMAT RULE:)', content, re.DOTALL)

if prompt_match:
    old_prompt = prompt_match.group(1)
    new_prompt = """const prompt = `
      You are an expert student success coach and study planner. Based on the provided book or study materials, generate a highly effective, personalized **Study Lesson Plan** for a student.
      Focus Area/Custom request: ${focusArea || "General study structure"}
      
      CRITICAL REQUIREMENT:
      Estimate the "Duration of Study Completion" (how many total hours or weeks). Provide this clearly in the 'duration' and 'totalUnits' fields of the output.
      
      In your 'fullMarkdownPlan', provide an in-depth lesson plan:
      1. Break down the provided textbook or study material into sequential **Units and Chapters** (NOT sessions).
      2. For each Unit/Chapter, specify:
         - Unit and Chapter name and estimated duration
         - Specific learning objectives for the student
         - Step-by-step study tasks (e.g. "Step 1: Read Section 1.1", "Step 2: Solve practice questions")
         - Self-assessment focus questions
      3. An optimization/tips section outlining dynamic rest periods (Pomodoro technique), memory consolidation strategies, and visual diagram review.
      
      ` + """
    # We also need to update the JSON schema to match the new units/chapters structure instead of sessions.
    # Actually, we can just replace the whole route handler block for simplicity.
