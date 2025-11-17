export const runtime = 'nodejs';

const PDF_FILE_IDS = [
  "file-2QiKHEfiSCKQAzaxRrmnKc",
  "file-NMHwmF86JWVSaCVfUpQWZp",
  "file-VepTsLv3uAtmGTE51zP2wU",
  "file-SzxKoK37Ev7wLXSeHNBmAP",
  "file-313EDCikLTwFww3UhjTJzg",
  "file-FeYUx1sfdsoRhAVQAzfNgq",
  "file-BNWBYXQxoxtaZojRwy4iUF",
  "file-1AjG1xP87XKS3Py8pZne79",
  "file-8jMYouLeJYHS6wEEJRNk3C",
  "file-XVGNfuxoTyp5MmBx5LUV5X",
  "file-Mr9HZ51f8xoK3bxGAbn949",
  "file-JgmvVVhB1wzk6rFwzvUwDg",
  "file-PBuKzikkXLBgXXR3wiDrRs"
];

let vectorStoreId = null;

async function getVectorStoreId(apiKey) {
  if (vectorStoreId) {
    return vectorStoreId;
  }
  // Create vector store
  const createRes = await fetch('https://api.openai.com/v1/vector_stores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ name: 'religion_pdf_store' })
  });
  const createData = await createRes.json();
  const vsId = createData.id;
  // Add files to vector store
  for (const fileId of PDF_FILE_IDS) {
    await fetch(`https://api.openai.com/v1/vector_stores/${vsId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ file_id: fileId })
    });
  }
  vectorStoreId = vsId;
  return vectorStoreId;
}

export async function POST(req) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const vsId = await getVectorStoreId(apiKey);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-preview',
        input: message,
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [vsId]
          }
        ]
      })
    });

    const data = await response.json();
    console.log('OpenAI response', JSON.stringify(data));
    const output =
      (data &&
        data.output &&
        data.output[0] &&
        data.output[0].content &&
        data.output[0].content[0] &&
        data.output[0].content[0].text) ||
      data.output_text ||
      'No valid output from model.';
    return new Response(JSON.stringify({ reply: output }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Error handling POST', e);
    return new Response(JSON.stringify({ reply: 'Server error.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
