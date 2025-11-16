import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 你的 Assistant ID（已经从旁边页面读取）
const ASSISTANT_ID = "asst_GhAw3GpyKVO9YmObNz8pbmNQ";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not set in Vercel environment",
    });
  }

  try {
    // 处理 body
    const { message } = req.body ?? {};
    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // 1️⃣ 创建线程
    const thread = await client.beta.threads.create();

    // 2️⃣ 添加消息
    await client.beta.threads.messages.create({
      thread_id: thread.id,
      role: "user",
      content: message,
    });

    // 3️⃣ 运行 assistant
    const run = await client.beta.threads.runs.create({
      thread_id: thread.id,
      assistant_id: ASSISTANT_ID,
    });

    // 4️⃣ 等待完成
    let completed = false;
    while (!completed) {
      const status = await client.beta.threads.runs.retrieve({
        thread_id: thread.id,
        run_id: run.id,
      });

      if (status.status === "completed") completed = true;
      else await new Promise((r) => setTimeout(r, 500));
    }

    // 5️⃣ 获取 assistant 回复
    const messages = await client.beta.threads.messages.list({
      thread_id: thread.id,
    });

    const reply = messages.data?.[0]?.content?.[0]?.text?.value || "No reply";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
