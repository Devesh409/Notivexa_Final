import sys

with open('server.ts', 'r') as f:
    lines = f.readlines()

new_endpoint = """
app.post("/api/generate-ppt", async (req, res) => {
  try {
    const { fileUri, mimeType, focusArea } = req.body;
    if (!fileUri) return res.status(400).json({ error: "Missing fileUri" });

    const ai = getGenAI();

    const prompt = `
      You are an expert presentation designer and academic tutor. 
      Analyze the provided study material and generate a comprehensive PowerPoint presentation structure.
      The presentation MUST contain at least 20 slides to thoroughly cover the material.
      
      The output MUST be a JSON object with:
      1. 'title': A descriptive title for the presentation (e.g., "${focusArea || 'Course Presentation'}").
      2. 'slides': An array of EXACTLY 20 or more slide objects.
      
      Each slide object MUST contain:
      - 'slideType': (string) One of "cover", "toc", "content", "diagram", "summary", "final".
      - 'title': (string) Title of the slide.
      - 'bullets': (array of strings) 3 to 6 bullet points of content.
      - 'speakerNotes': (string) Detailed speaker notes for this slide (at least 30 words).
      - 'diagrams': (optional array of objects) For 'diagram' type slides, include { title: string, items: string[] }.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-2.5-flash",
        contents: await getContentParts(fileUri, mimeType, prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideType: { type: Type.STRING },
                    title: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    speakerNotes: { type: Type.STRING },
                    diagrams: { 
                      type: Type.ARRAY, 
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          items: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                      }
                    }
                  },
                  required: ["slideType", "title", "bullets", "speakerNotes"]
                }
              }
            },
            required: ["title", "slides"]
          }
        }
      });
      
      const parsedData = safeParseJson(response.text || "{}");
      return res.json({ ppt: parsedData || {} });
    } catch (error: any) {
      console.error("PPT generation error:", error);
      const formatted = formatGeminiError(error);
      const statusCode = (error?.status === 429 || formatted.includes("rate limit") || formatted.includes("wait")) ? 429 : 500;
      return res.status(statusCode).json({ error: formatted });
    }
  } catch (error: any) {
    console.error("PPT explanation outer error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});
"""

insert_idx = 0
for i, line in enumerate(lines):
    if line.startswith('app.post("/api/ocr"'):
        insert_idx = i
        break

lines.insert(insert_idx, new_endpoint)

with open('server.ts', 'w') as f:
    f.writelines(lines)
