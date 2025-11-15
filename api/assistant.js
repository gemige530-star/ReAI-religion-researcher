import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // 1. 创建 thread
    const thread = await client.beta.threads.create({
      messages: [
        { role: "user", content: message }
      ]
    });

    // 2. 运行 assistant
    const run = await client.beta.threads.runs.createAndPoll(
      thread.id,
      {
        assistant_id: "asst_GhAw3GpyKVO9YmObNz8pbmNQ"
      }
    );

    // 3. 提取最后一条消息
    const messages = await client.beta.threads.messages.list(thread.id);
    const last = messages.data[0];

    const text = last?.content?.[0]?.text?.value ?? "No reply";

    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
