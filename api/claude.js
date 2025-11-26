export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4096,
        messages
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Serverless function error:", err);
    return res.status(500).json({
      error: "Serverless function crashed",
      details: err.message
    });
  }
}
