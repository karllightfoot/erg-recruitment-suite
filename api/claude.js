// api/claude.js
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing ANTHROPIC_API_KEY on server" });
    return;
  }

  // Parse JSON body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const { prompt, isDocument = false, documentData = null, mediaType = null } = body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt'" });
    return;
  }

  // Build Anthropic payload
  const payload = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8000,
    messages: []
  };

  if (isDocument && documentData && mediaType) {
    // Document + text combo
    payload.messages.push({
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: mediaType,
            data: documentData
          }
        },
        {
          type: "text",
          text: prompt
        }
      ]
    });
  } else {
    // Plain text
    payload.messages.push({
      role: "user",
      content: prompt
    });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload)
    });

    const textBody = await anthropicRes.text();

    if (!anthropicRes.ok) {
      console.error("Anthropic error:", textBody);
      res.status(anthropicRes.status).json({
        error: "Anthropic API error",
        details: textBody
      });
      return;
    }

    const data = JSON.parse(textBody);
    const text = data?.content?.[0]?.text || "";

    res.status(200).json({ text });
  } catch (e) {
    console.error("Server error calling Anthropic:", e);
    res.status(500).json({ error: "Server error calling Anthropic" });
  }
}
