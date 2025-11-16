import OpenAI from "openai";

export const config = {
  runtime: "nodejs18.x"
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // 自动处理预检请求，防止 405
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // 强制只允许 POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // 创建 thread
    const thread = await client.beta.threads.create();

    // 用户消息
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    // Assistant 运行
    await client.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.ASSISTANT_ID
    });

    // 获取回复
    const messages = await client.beta.threads.messages.list(thread.id);
    const lastMsg = messages.data
      .filter(m => m.role === "assistant")
      .at(-1);

    const reply = lastMsg?.content?.[0]?.text?.value || "No reply";

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
