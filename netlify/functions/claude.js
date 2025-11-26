// netlify/functions/claude.js

import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);

    // Validate
    if (!body || !body.messages) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'messages' in request" })
      };
    }

    // Call Anthropic API securely
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}
