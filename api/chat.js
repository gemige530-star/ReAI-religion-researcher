import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { message } = await req.json();

    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a helpful assistant focused on digital religion research." },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No reply.";
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
