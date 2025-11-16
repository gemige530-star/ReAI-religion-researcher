import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vercel 必须使用 nodejs runtime
export const config = {
  runtime: "nodejs",
};

// 你的 Assistant ID
const ASSISTANT_ID = "asst_eTl59y1ExSHtePteguSSf1PX";

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
    // 读取 body
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const { message } = JSON.parse(body || "{}");

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' in request body" });
    }

    // 1️⃣ 创建新线程（Thread）
    const thread = await client.beta.threads.create();

    // 2️⃣ 添加用户消息
    await client.beta.threads.messages.create({
      thread_id: thread.id,
      role: "user",
      content: message,
    });

    // 3️⃣ 使用 Assistant 运行
    const run = await client.beta.threads.runs.create({
      thread_id: thread.id,
      assistant_id: ASSISTANT_ID,
    });

    // 4️⃣ 等待 Assistant 完成
    let finished = false;
    while (!finished) {
      const status = await client.beta.threads.runs.retrieve({
        thread_id: thread.id,
        run_id: run.id,
      });
      if (status.status === "completed") finished = true;
      else await new Promise((r) => setTimeout(r, 500));
    }

    // 5️⃣ 获取回复
    const messages = await client.beta.threads.messages.list({
      thread_id: thread.id,
    });

    const last = messages.data[0]?.content?.[0]?.text?.value ?? "No reply";

    return res.status(200).json({ reply: last });
  } catch (err) {
    console.error("API error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
}
