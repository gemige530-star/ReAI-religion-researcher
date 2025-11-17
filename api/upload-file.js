export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  try {
    let rawBody = [];
    for await (const chunk of req) {
      rawBody.push(chunk);
    }
    const buffer = Buffer.concat(rawBody);

    res.status(200).json({
      ok: true,
      size: buffer.length,
      message: 'File upload endpoint is working.',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
