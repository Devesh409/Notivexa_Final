with open("server.ts", "r") as f:
    content = f.read()

import re

old_chat_endpoint = '''// 7. AI Chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, fileUri, mimeType } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const ai = getGenAI();

    const fullPrompt = `You are an AI study assistant. Answer the following question based on the provided document/book context.
    
    Provide the answer as a list of points. Each point must start on a new line, prefixed with a • symbol, and there must be a blank line between each point.
    Do NOT use any Markdown formatting characters, especially # and *.
    
    Question: ${prompt}`;

    const contents = fileUri 
      ? await getContentParts(fileUri, mimeType || "application/pdf", fullPrompt)
      : [{ role: "user", parts: [{ text: fullPrompt }] }];

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash-lite",
      contents: contents
    });
    return res.json({ result: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});'''

new_chat_endpoint = '''// 7. AI Chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, fileUri, mimeType, history = [] } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const ai = getGenAI();

    let contents = [];
    const sysPrompt = "You are a highly capable AI tutor and study assistant. You help students understand concepts, answer questions, and break down complex topics based on the provided document context. Use rich Markdown formatting (bold, italics, lists, code blocks, tables) to make your explanations structured and easy to read. Be encouraging, precise, and educational.";

    if (fileUri) {
      // Get the document contents
      const fileParts = await getContentParts(fileUri, mimeType || "application/pdf", "");
      // fileParts[0] is { role: "user", parts: [ {text: doc}, {text: prompt} ] }
      // We will replace the prompt part with our sys instruction
      const docMsg = fileParts[0];
      if (docMsg && docMsg.parts) {
        docMsg.parts[docMsg.parts.length - 1] = { text: sysPrompt };
      }
      contents.push(docMsg);
      contents.push({ role: "model", parts: [{ text: "Understood. I have reviewed the document and am ready to act as your AI tutor." }] });
    } else {
      contents.push({ role: "user", parts: [{ text: sysPrompt }] });
      contents.push({ role: "model", parts: [{ text: "Understood. I am ready to act as your AI tutor." }] });
    }

    // Append history
    for (const msg of history) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }]
      });
    }

    // Append current prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash-lite",
      contents: contents
    });
    return res.json({ result: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    const formatted = formatGeminiError(error);
    return res.status(500).json({ error: formatted });
  }
});'''

content = content.replace(old_chat_endpoint, new_chat_endpoint)

with open("server.ts", "w") as f:
    f.write(content)
