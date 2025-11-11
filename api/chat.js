import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "nodejs18.x", // ✅ 修正 runtime
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
    });

    const { message } = JSON.parse(body || "{}");

    const completion = await client.chat.completions.create({
      model: "gpt-4o", // ✅ 修正模型名
      messages: [
        { role: "system", content: "You are a helpful assistant for AI and religion research." },
        { role: "user", content: message },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "No reply";
    res.status(200).json({ reply: text });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
