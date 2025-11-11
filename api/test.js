// api/test.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "nodejs18.x",
};

export default async function handler(req, res) {
  try {
    // 调用最轻量的请求测试接口
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello from test.js!" }],
      max_tokens: 20,
    });

    const text = completion.choices?.[0]?.message?.content || "No reply";
    res.status(200).json({ success: true, reply: text });
  } catch (error) {
    console.error("Test API error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Connection failed",
    });
  }
}

