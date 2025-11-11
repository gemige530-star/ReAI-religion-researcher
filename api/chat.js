import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 禁用 Edge Runtime，改用 Node.js，防止 GPT-5 调用超时
export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-5", // ✅ 使用 GPT-5
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant focused on religion research.",
        },
        { role: "user", content: message },
      ],
    });

    res.status(200).json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
}
