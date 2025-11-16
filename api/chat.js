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

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY is not set in Vercel environment" });
  }

  try {
    // 读取原始 body（Vercel Node API）
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const { message } = JSON.parse(body || "{}");

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    // ---------------------------
    // Assistants API 工作流程开始
    // ---------------------------

    // ① 创建一个 thread
    const thread = await client.beta.threads.create();

    // ② 把用户消息写入 thread
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // ③ 启动 assistant 运行
    const run = await client.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.ASSISTANT_ID,
    });

    // ④ 获取 assistant 的最终回复
    const messages = await client.beta.threads.messages.list(thread.id);

    const lastMsg = messages.data
      .filter((m) => m.role === "assistant")
      .at(-1);

    const reply =
      lastMsg?.content?.[0]?.text?.value || "No reply from assistant";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
