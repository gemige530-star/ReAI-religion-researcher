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
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    if (!body) {
      return res.status(400).json({ error: "Empty request body" });
    }

    const { message } = JSON.parse(body || "{}");
    if (!message) {
      return res.status(400).json({ error: "Missing 'message' field" });
    }

    // 调用 OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a helpful assistant for AI and religion research." },
        { role: "user", content: message },
      ],
      stream: false,
    });

    const text = completion.choices?.[0]?.message?.content || "No reply";
    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("API error:", err);

    // 针对常见错误返回不同状态码
    if (err.response) {
      // OpenAI 返回的错误
      return res.status(err.response.status || 500).json({
        error: err.response.data?.error?.message || "OpenAI API error",
      });
    }

    if (err.name === "SyntaxError") {
      return res.status(400).json({ error: "Invalid JSON format in request body" });
    }

    if (err.message?.includes("Invalid API key")) {
      return res.status(401).json({ error: "Invalid or missing OpenAI API key" });
    }

    // 兜底错误
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
