import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // ❗ Vercel 必须禁用 bodyParser 才能接收文件
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Upload error" });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "Missing file" });
    }

    try {
      const uploaded = await client.files.create({
        file: fs.createReadStream(file.filepath),
        purpose: "assistants",
      });

      return res.status(200).json({
        file_id: uploaded.id,
        filename: uploaded.filename,
      });
    } catch (error) {
      console.error("OpenAI upload error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}
