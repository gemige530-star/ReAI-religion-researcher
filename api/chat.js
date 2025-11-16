import OpenAI from "openai";

export const config = {
  runtime: "nodejs",       // Vercel 接受的唯一 node runtime
  api: {
    bodyParser: true       // 必须有，否则 req.body 是 undefined
  }
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    // --- CORS ---
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // OPTIONS 预检
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // 强制 POST
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // ---- Assistants Threads 正式流程 ----
    const thread = await client.beta.threads.create();

    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    await client.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.ASSISTANT_ID
    });

    const messages = await client.beta.threads.messages.list(thread.id);

    const lastMsg = messages.data
      .filter(m => m.role === "assistant")
      .at(-1);

    const reply = lastMsg?.content?.[0]?.text?.value || "No reply";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
