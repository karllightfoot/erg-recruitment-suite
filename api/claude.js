export default async function handler(req, res) {
  try {
    // Read raw body (Vercel Node request doesn't parse JSON by default)
    let rawBody = "";
    for await (const chunk of req) {
      rawBody += chunk;
    }

    let body = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        console.error("Failed to parse JSON body:", rawBody);
        return res.status(400).json({
          error: "Invalid JSON body",
        });
      }
    }

    const { messages } = body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid request: 'messages' must be an array",
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 8000,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error("Anthropic API error:", data);
      return res.status(500).json({
        error: "Anthropic API error",
        details: data,
      });
    }

    let text = "";
    if (typeof data.content === "string") {
      text = data.content;
    } else if (Array.isArray(data.content)) {
      text = data.content.map((part) => part.text || "").join("\n");
    } else if (typeof data.output_text === "string") {
      text = data.output_text;
    } else {
      text = JSON.stringify(data);
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Serverless function error:", err);
    return res.status(500).json({
      error: "Serverless function crashed",
      details: err.message,
    });
  }
}
