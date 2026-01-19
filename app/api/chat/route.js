// app/api/chat/route.js  (Next.js App Router)
// Uses the "classic" Chat Completions API: POST /v1/chat/completions
// Returns: { reply: "..." }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { message } = await req.json().catch(() => ({}));
    if (typeof message !== "string" || !message.trim()) {
      return Response.json({ error: "Missing or invalid message" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Provide one direct answer." },
          { role: "user", content: message }
        ],
        temperature: 0.2
      })
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "Upstream returned non-JSON", details: raw.slice(0, 1200) },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      return Response.json(
        { error: "OpenAI API error", status: upstream.status, details: data },
        { status: 502 }
      );
    }

    const reply = data?.choices?.[0]?.message?.content ?? "";
    return Response.json({ reply: reply || "No output" }, { status: 200 });

  } catch (err) {
    return Response.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
