export const runtime = "nodejs";

const PDF_FILE_IDS = [
  "file-xxxx",
  "file-yyyy"
  // ...
];

export async function POST(req) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    // 第一次请求：让模型判断是否需要 file_search
    let response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-preview",
        input: message,
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: {
            file_ids: PDF_FILE_IDS
          }
        }
      })
    });

    let data = await response.json();
    console.log("FIRST RESPONSE:", data);

    // 解析第一次响应的类型
    const firstOutput = data.output?.[0];

    // 如果模型直接返回文本（无需工具）
    if (firstOutput?.type === "message") {
      const text = firstOutput.content?.[0]?.text || "No output";
      return new Response(JSON.stringify({ reply: text }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 如果模型要求调用工具（这是 file_search 的情况）
    if (firstOutput?.type === "tool_call") {
      const toolCall = firstOutput;
      const toolName = toolCall.name;
      const toolArgs = toolCall.arguments;

      console.log("TOOL CALL RECEIVED:", toolCall);

      // 实际执行工具：这里 file_search 是由 OpenAI 自动执行的
      // 所以你只需要把 tool_call 回传给 API 即可
      const secondResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-preview",
          input: [
            {
              role: "tool",
              tool_call_id: toolCall.id,
              output: toolArgs
            }
          ]
        })
      });

      const secondData = await secondResponse.json();
      console.log("SECOND RESPONSE:", secondData);

      // 提取最终内容
      const finalText =
        secondData.output?.[0]?.content?.[0]?.text ||
        "No final output";

      return new Response(JSON.stringify({ reply: finalText }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 无法解析
    return new Response(
      JSON.stringify({ reply: "Unexpected response structure." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(JSON.stringify({ reply: "Server error." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
