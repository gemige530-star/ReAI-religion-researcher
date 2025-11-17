export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDF_FILE_IDS = ["file-xxxx", "file-yyyy"];

export async function POST(req) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    // Safety check
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500 }
      );
    }

    // Step 1: send question to model
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: [
          {
            role: "system",
            content:
              "You are a file-aware research assistant. Decide if file_search is needed. Provide one direct answer."
          },
          {
            role: "user",
            content: message
          }
        ],
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: { file_ids: PDF_FILE_IDS }
        }
      })
    });

    const data = await response.json();

    // Structure safety
    if (!data.output || !Array.isArray(data.output)) {
      return new Response(
        JSON.stringify({ error: "Invalid response format" }),
        { status: 500 }
      );
    }

    const out = data.output[0];

    // Case 1: direct answer
    if (out.type === "message") {
      const text = out.content?.[0]?.text || "No output";
      return new Response(JSON.stringify({ reply: text }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Case 2: needs tool_call
    if (out.type === "tool_call") {
      const tc = out;

      const response2 = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          // Need full conversation history so model can continue correctly
          input: [
            {
              role: "system",
              content:
                "You are a file-aware research assistant. Provide one direct answer."
            },
            {
              role: "user",
              content: message
            },
            {
              role: "tool",
              tool_call_id: tc.id,
              output: tc.arguments
            }
          ]
        })
      });

      const data2 = await response2.json();

      const finalText =
        data2.output?.[0]?.content?.[0]?.text || "No final output";

      return new Response(JSON.stringify({ reply: finalText }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unhandled result type" }), {
      status: 500
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown server error" }),
      { status: 500 }
    );
  }
}
