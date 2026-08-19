import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = [
    "gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-3.5-flash",
    "gemini-2.0-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash-preview", 
    "gemini-pro-latest"
  ];
  
  for (const model of models) {
    try {
      console.log(`Trying ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: "Say hello!"
      });
      console.log(`${model} SUCCESS! Response: ${response.text}`);
    } catch(e: any) {
      console.error(`${model} FAILED: ${e.message}`);
    }
  }
}
run();
