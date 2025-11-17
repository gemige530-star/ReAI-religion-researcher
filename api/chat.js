import pdf from "pdf-parse";
import { Buffer } from "buffer";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { message, file_id } = await req.json();
    let fileText = "";

    if (file_id) {
      const url = (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "") + "/api/upload-file?file_id=" + file_id;
      const res = await fetch(url);
      const fileBuffer = Buffer.from(await res.arrayBuffer());

      try {
        const parsed = await pdf(fileBuffer);
        fileText = parsed.text.substring(0, 20000);
      } catch (e) {
        fileText = "Unable to parse PDF file.";
      }
    }

    const reply = fileText ? `以下是上传文件的内容：\n${fileText}` : `未上传文件。用户消息：${message}`;

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ reply: "Backend error." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
