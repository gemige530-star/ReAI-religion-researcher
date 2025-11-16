import OpenAI from "openai";

export const config = {
  runtime: "nodejs",        // 必须是 nodejs（不是 nodejs18.x）
  api: {
    bodyParser: true        // 让 req.body 正常工作
  }
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // ------- CORS --------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // --------- 取 message ---------
    const body = req.body ?? {};
    const message = body.message;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // --------- Assistants Threads ---------
    const thread = await client.beta.threads.create();

    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    const run = await client.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.ASSISTANT_ID
    });

    const msgs = await client.beta.threads.messages.list(thread.id);

    const assistantMsg =
      msgs.data.filter(m => m.role === "assistant").pop();

    const reply =
      assistantMsg?.content?.[0]?.text?.value ||
      "No reply.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server internal error" });
  }
}
