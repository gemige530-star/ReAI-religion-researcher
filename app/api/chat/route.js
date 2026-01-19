// app/api/chat/route.js
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
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Provide one direct answer." },
          { role: "user", content: message },
        ],
        temperature: 0.2,
      }),
    });

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const raw = await upstream.text();
      return Response.json(
        {
          error: "OpenAI returned non-JSON",
          status: upstream.status,
          contentType,
          details: raw.slice(0, 1200),
        },
        { status: 502 }
      );
    }

    const data = await upstream.json();

    if (!upstream.ok) {
      return Response.json(
        { error: "OpenAI API error", status: upstream.status, details: data },
        { status: 502 }
      );
    }

    const reply = data?.choices?.[0]?.message?.content ?? "";
    return Response.json({ reply: reply || "No output" }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}

// Added GET handler to avoid 404 on GET requests
export async function GET() {
  return Response.json(
    { message: "This endpoint expects a POST request with JSON body { message: string }." },
    { status: 200 }
  );
}
