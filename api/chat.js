import OpenAI from "openai";
import pdf from "pdf-parse";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req) {
  try {
    const { message, file_id } = await req.json();

    let fileText = "";

    // If a file was uploaded, read it from the upload API
    if (file_id) {
      const url = `${
        process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""
      }/api/upload-file?file_id=${file_id}`;
      const res = await fetch(url);
      const fileBuffer = Buffer.from(await res.arrayBuffer());

      try {
        const parsed = await pdf(fileBuffer);
        fileText = parsed.text.substring(0, 20000); // limit text length
      } catch (e) {
        fileText = "Unable to parse PDF file.";
      }
    }

    const finalPrompt = fileText
      ? `用户的问题：${message}\n\n以下是上传文件的内容，请分析：\n${fileText}`
      : message;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }],
    });

    return new Response(
      JSON.stringify({
        reply: completion.choices[0].message.content,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ reply: "Backend error." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
