export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    let rawBody = [];
    for await (const chunk of req) {
      rawBody.push(chunk);
    }
    const buffer = Buffer.concat(rawBody);
    const file_id = 'file_' + Date.now();
    return res.status(200).json({ file_id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
