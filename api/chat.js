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

export async function POST(req) {
  try {
    const { message } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: message,
        tools: [
          { type: "file_search" }
        ],
        tool_resources: {
          file_search: {
            file_ids: PDF_FILE_IDS
          }
        }
      })
    });

    const data = await res.json();

    const output =
      data?.output?.[0]?.content?.[0]?.text ||
      data?.output_text ||
      "No valid output.";

    return new Response(
      JSON.stringify({ reply: output }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ reply: "Server error." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
