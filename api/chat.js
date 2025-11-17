export const runtime = "nodejs";

const PDF_FILE_IDS = [
  "file-xxxx",
  "file-yyyy"
];

export async function POST(req) {
  const { message } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  // Step 1: send user question + system prompt
  let response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content:
            "You are a file-aware research assistant. When a user asks any question, automatically decide whether file_search is needed. If the answer requires reading PDFs, use file_search. If not, answer directly. Always return one clear, direct answer."
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
  const out = data.output?.[0];

  // Case 1: directly answered
  if (out?.type === "message") {
    const text = out.content?.[0]?.text || "No output";
    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Case 2: tool_call (file_search)
  if (out?.type === "tool_call") {
    const tc = out;

    const response2 = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          input: [
            {
              role: "tool",
              tool_call_id: tc.id,
              output: tc.arguments
            }
          ]
        })
      }
    );

    const data2 = await response2.json();
    const finalText =
      data2.output?.[0]?.content?.[0]?.text || "No final output";

    return new Response(JSON.stringify({ reply: finalText }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ reply: "Unexpected response format" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
