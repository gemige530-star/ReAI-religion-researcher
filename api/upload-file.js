// fix 401 unauthorized by allowing GET retrieval
const files = {};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const rawBody = [];
      for await (const chunk of req) {
        rawBody.push(chunk);
      }
      const buffer = Buffer.concat(rawBody);
      const file_id = 'file_' + Date.now();
      files[file_id] = buffer;
      return res.status(200).json({ file_id });
    } catch (error) {
      return res.status(500).json({ error: 'Upload failed' });
    }
  } else if (req.method === 'GET') {
    const { id } = req.query;
    if (id && files[id]) {
      const buffer = files[id];
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.status(200).send(buffer);
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
