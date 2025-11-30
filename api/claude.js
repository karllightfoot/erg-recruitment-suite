export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "Missing messages array" });
    }

    // Call Anthropic API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",   // ✅ UPDATED MODEL
        max_tokens: 4096,
        messages
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error("Anthropic API error:", data);
      return res.status(500).json({ error: data });
    }

    // Normalise response for your frontend
    let text = "";

    if (typeof data.text === "string") {
      text = data.text;
    } else if (Array.isArray(data.content)) {
      text = data.content.map(c => c.text || "").join("\n");
    } else {
      text = JSON.stringify(data);
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error("Serverless function crashed:", err);
    return res.status(500).json({
      error: "Serverless function crashed",
      details: err.message
    });
  }
}
