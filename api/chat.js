export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { message, file_id } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    let userMsg = message;
    let reply;

    // If message contains blank line, treat following part as uploaded file info
    if (message.includes("\n\n")) {
      const parts = message.split("\n\n");
      userMsg = parts[0];
      const fileText = parts.slice(1).join("\n\n");
      const fileLength = fileText.length;
      reply = `You asked: ${userMsg}. I received a file with ${fileLength} characters to analyze.`;
    } else {
      reply = `You said: ${userMsg}`;
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Error generating reply:", error);
    return res.status(500).json({ error: "Error generating reply" });
  }
}
