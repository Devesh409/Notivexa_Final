import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const testModels = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite"
  ];

  for (const model of testModels) {
    const start = Date.now();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: "Generate 1 bullet point summarizing what photosynthesis is."
      });
      const elapsed = Date.now() - start;
      console.log(`[PASS] ${model} (${elapsed}ms): ${response.text?.trim()}`);
    } catch (err: any) {
      const elapsed = Date.now() - start;
      console.log(`[FAIL] ${model} (${elapsed}ms): ${err.status} - ${err.message?.split('\n')[0]}`);
    }
  }
}

run();

