export default async function handler(req, res) {
  try {
    // 🔥 Parse JSON body manually (Vercel does NOT do this automatically)
    const { messages } = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

    if (!messages) {
      return res.status(400).json({ error: "No messages provided" });
    }

    // 🔥 Call Anthropic API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4096,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Serverless function crashed:", err);
    return res.status(500).json({
      error: "Serverless function crashed",
      details: err.message
    });
  }
}
