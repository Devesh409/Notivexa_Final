const { GoogleGenAI } = require("@google/genai");

async function run() {
  try {
    const ai = new GoogleGenAI({});
    for await (const m of ai.models.list()) {
        if (m.name.includes("gemini")) {
            console.log(m.name);
        }
    }
  } catch(e) {
    console.error(e);
  }
}
run();
