// Vercel Serverless Function: /api/claude
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ---- Safely read JSON body (works even if req.body is undefined) ----
    let messages;

    // If Vercel already parsed JSON:
    if (req.body && typeof req.body === "object") {
      ({ messages } = req.body);
    } else {
      // Fallback: manually read and parse the raw request body
      const rawBody = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });

      const parsed = rawBody ? JSON.parse(rawBody) : {};
      messages = parsed.messages;
    }

    if (!messages) {
      return res.status(400).json({ error: "Missing 'messages' in request body" });
    }

    // ---- Call Anthropic API ----
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3.5-sonnet-latest",
        max_tokens: 4096,
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

    // ---- Normalise Claude response to a simple text string ----
    let text = "";

    if (typeof data.content === "string") {
      text = data.content;
    } else if (Array.isArray(data.content)) {
      text = data.content.map((part) => part.text || "").join("\n");
    } else if (typeof data.text === "string") {
      text = data.text;
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
