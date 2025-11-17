import { Buffer } from 'buffer';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { message, file_id } = await req.json();
    let fileText = "";
    if (file_id) {
      const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
      const url = `${base}/api/upload-file?id=${file_id}`;
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      try {
        const { default: pdf } = await import('pdf-parse');
        const parsed = await pdf(fileBuffer);
        fileText = parsed.text.substring(0, 20000);
      } catch (e) {
        fileText = "Unable to parse PDF file.";
      }
    }
    const reply = fileText ? `以下是上传文件的内容：\n${fileText}` : `未上传文件。用户消息：${message}`;
    return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ reply: "Backend error." }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}
