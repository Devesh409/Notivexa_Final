import re

with open("server.ts", "r") as f:
    content = f.read()

# We need to find app.post("/api/generate-lesson-plan" and replace until the end of that block.
# Finding it by regex:
pattern = r'app\.post\("/api/generate-lesson-plan", async \(req, res\) => \{.*?\n\}\);'
new_route = """app.post("/api/generate-lesson-plan", async (req, res) => {
  try {
    const { fileUri, mimeType, focusArea, role } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });
    const ai = getGenAI();
    
    const prompt = `
      You are an expert student success coach and study planner. Based on the provided book or study materials, generate a highly effective, personalized **Study Lesson Plan** for a student.
      Focus Area/Custom request: ${focusArea || "General study structure"}
      
      CRITICAL REQUIREMENT:
      Estimate the "Duration of Study Completion" (how many total hours or weeks). Provide this clearly in the 'duration' and 'totalUnits' fields of the output.
      
      In your 'fullMarkdownPlan', provide an in-depth lesson plan ONLY IN TEXT FORMAT:
      1. Break down the provided textbook or study material into sequential **Units and Chapters** (NOT sessions).
      2. For each Unit and Chapter, specify:
         - Unit/Chapter name and estimated duration
         - Specific learning objectives for the student
         - Step-by-step study tasks (e.g. "Step 1: Read Section 1.1", "Step 2: Solve practice questions")
         - Self-assessment focus questions
      3. An optimization/tips section outlining dynamic rest periods (Pomodoro technique), memory consolidation strategies, and visual diagram review.
      
      CRITICAL FORMAT RULE:
      - STRICTLY DO NOT use arrows (e.g. "->", "-->", "=>") in plain text. Use clean numbered bullet points or explicit step headers. Arrows are ONLY allowed inside Mermaid syntax blocks.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash-lite",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              duration: { type: Type.STRING },
              totalUnits: { type: Type.STRING },
              units: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    description: { type: Type.STRING },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    activities: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "duration", "description", "objectives", "activities"]
                }
              },
              fullMarkdownPlan: { type: Type.STRING }
            },
            required: ["duration", "totalUnits", "units", "fullMarkdownPlan"]
          }
        }
      });
        
      const parsedPlan = safeParseJson(response.text || "{}");
      return res.json({ lessonPlan: parsedPlan || {} });
    } catch (error: any) {
      console.error("Lesson plan error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("Lesson plan outer error:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});"""

content_new = re.sub(pattern, new_route, content, flags=re.DOTALL)
if content_new != content:
    with open("server.ts", "w") as f:
        f.write(content_new)
    print("Patched!")
else:
    print("Regex failed to match!")
