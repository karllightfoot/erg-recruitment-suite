// ✅ UPDATED: call Vercel serverless function instead of Anthropic directly
const callAPI = async (
  prompt,
  isDocument = false,
  documentData = null,
  mediaType = null
) => {
  // Build Claude "messages" array
  const messages = [];

  if (isDocument && documentData && mediaType) {
    // Document + prompt
    messages.push({
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: mediaType,
            data: documentData,
          },
        },
        {
          type: "text",
          text: prompt,
        },
      ],
    });
  } else {
    // Plain text prompt
    messages.push({
      role: "user",
      content: prompt,
    });
  }

  // Call Vercel serverless function
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Claude API error:", errText);
    throw new Error("Claude API request failed");
  }

  const data = await res.json();
