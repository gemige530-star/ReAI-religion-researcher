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

    // create a new thread
    const thread = await client.beta.threads.create();

    // add the user message to the thread
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // run the assistant on the thread
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // poll until the run completes or fails
    while (true) {
      const runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === "completed") {
        break;
      }
      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        return res.status(500).json({
          error: `Run ${runStatus.status}`,
          details: runStatus.last_error,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // fetch messages from the thread and extract the assistant's reply
    const messages = await client.beta.threads.messages.list(thread.id);
    const reply =
      messages.data?.[0]?.content?.[0]?.text?.value || "No reply";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
