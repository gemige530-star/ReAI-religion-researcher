import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  // Vercel 现在支持的值： "nodejs" | "edge" | "experimental-edge"
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", resolve);
      req.on("error", reject);
    });

    const { message } = JSON.parse(body || "{}");

    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for AI and religion research.",
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
