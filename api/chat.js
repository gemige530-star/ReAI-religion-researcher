import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = "asst_GhAw3GpyKVO9YmObNz8pbmNQ";

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
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    const thread = await client.beta.threads.create();

    await client.beta.threads.messages.create({
      thread_id: thread.id,
      role: "user",
      content: message,
    });

    const run = await client.beta.threads.runs.create({
      thread_id: thread.id,
      assistant_id: ASSISTANT_ID,
    });

    let done = false;
    while (!done) {
      const status = await client.beta.threads.runs.retrieve({
        thread_id: thread.id,
        run_id: run.id,
      });

      if (status.status === "completed") {
        done = true;
      } else if (
        status.status === "failed" ||
        status.status === "cancelled" ||
        status.status === "expired"
      ) {
        console.error("Run status:", status.status, status.last_error);
        return res.status(500).json({
          error: `Run ${status.status}`,
          details: status.last_error,
        });
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }
    }

    const messages = await client.beta.threads.messages.list({
      thread_id: thread.id,
    });

    const first = messages.data[0];
    const reply =
      first &&
      first.content &&
      first.content[0] &&
      first.content[0].type === "text"
        ? first.content[0].text.value
        : "No reply";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
