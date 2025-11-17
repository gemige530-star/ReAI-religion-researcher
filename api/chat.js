import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { message, file_id } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Missing 'message'" });
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: message }
          ]
        }
      ],
      tools: file_id ? [{ type: "file_search" }] : [],
      tool_resources: file_id
        ? {
            file_search: {
              file_ids: [file_id],
            },
          }
        : {},
      temperature: 0.2,
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "(no response)";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
