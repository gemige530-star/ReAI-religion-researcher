import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  // 这行是这次部署失败的根源，必须用 "nodejs"
  runtime: "nodejs",
};

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 环境变量没配好时，直接返回明确错误
  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY is not set in Vercel environment" });
  }

  try {
    // 读取原始 body
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", resolve);
      req.on("error", reject);
    });

    const { message } = JSON.parse(body || "{}");

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message' in request body" });
    }

    // 使用 chat.completions.create
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for AI and religion research.",
        },
        { role: "user", content: message },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? "No reply";

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("API error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
}
