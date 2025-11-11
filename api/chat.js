import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "nodejs", // 禁止 edge, 避免 CPU 超时
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 读取请求体
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
    });

    const { message } = JSON.parse(body || "{}");

    // ✅ 使用流式输出防止超时
    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a helpful assistant for AI and religion research." },
        { role: "user", content: message },
      ],
      stream: false, // ⚠️ 改成 true 会返回流，若要兼容 JSON 前端，就设 false
    });

    const text = completion.choices?.[0]?.message?.content || "No reply";

    res.status(200).json({ reply: text });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
