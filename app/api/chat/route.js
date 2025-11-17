export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDF_FILE_IDS = ["file-xxxx", "file-yyyy"];

export async function POST(req) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500
      });
    }

    // --------------------------------------------
    // Helper: extract output_text from a response
    // --------------------------------------------
    const extractText = (resp) => {
      const blocks = resp.output?.[0]?.content || [];
      for (const b of blocks) {
        if (b.type === "output_text") return b.text;
      }
      return null;
    };

    // --------------------------------------------
    // Helper: detect tool call
    // --------------------------------------------
    const extractToolCall = (resp) => {
      const blocks = resp.output?.[0]?.content || [];
      for (const b of blocks) {
        if (b.type === "tool_call") return b;
      }
      return null;
    };

    // --------------------------------------------
    // 1: first request
    // --------------------------------------------
    const response1 = await fetch("https://api.openai.com/v1/responses", {
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
        tools: {
          file_search: {}
        },
        tool_resources: {
          file_search: { file_ids: PDF_FILE_IDS }
        }
      })
    });

    const data1 = await response1.json();

    const toolCall = extractToolCall(data1);

    // --------------------------------------------
    // Case A: no tool call
    // --------------------------------------------
    if (!toolCall) {
      const text = extractText(data1) || "No output";
      return new Response(JSON.stringify({ reply: text }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // --------------------------------------------
    // Case B: tool call exists
    // Execute the file_search tool
    // --------------------------------------------
    let toolResult;
    if (toolCall.tool_name === "file_search") {
      const args = toolCall.arguments; // already JSON
      // Call Files API
      const toolResp = await fetch(
        "https://api.openai.com/v1/tools/file_search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify(args)
        }
      );
      toolResult = await toolResp.json();
    }

    // --------------------------------------------
    // 2: second request with tool result
    // --------------------------------------------
    const response2 = await fetch("https://api.openai.com/v1/responses", {
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
            content: "You are a file-aware research assistant. Provide one direct answer."
          },
          {
            role: "user",
            content: message
          },
          {
            role: "tool",
            tool_call_id: toolCall.tool_call_id,
            content: JSON.stringify(toolResult)
          }
        ],
        tools: {
          file_search: {}
        },
        tool_resources: {
          file_search: { file_ids: PDF_FILE_IDS }
        }
      })
    });

    const data2 = await response2.json();
    const finalText = extractText(data2) || "No final output";

    return new Response(JSON.stringify({ reply: finalText }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown server error" }),
      { status: 500 }
    );
  }
}
