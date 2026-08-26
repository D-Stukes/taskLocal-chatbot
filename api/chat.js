// Server-side proxy for the Anthropic Messages API.
//
// The dashboard used to call https://api.anthropic.com/v1/messages directly
// from the browser. That can't work without an API key attached to the
// request, and an API key can't be added to that client-side call safely --
// anything read via `import.meta.env.VITE_*` (the only env vars Vite
// exposes to browser code) ships inside the built JS bundle, visible to
// anyone who opens dev tools or views source. This function holds
// ANTHROPIC_API_KEY as a plain server-side environment variable instead
// (set it in Vercel's Project Settings -> Environment Variables, NOT
// prefixed with VITE_) and the frontend calls this endpoint instead of
// Anthropic directly.
//
// Vercel auto-detects any file under /api as a serverless function -- no
// extra config needed beyond setting the env var.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return response
      .status(500)
      .json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  }

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(request.body),
    });

    const data = await anthropicResponse.json();
    return response.status(anthropicResponse.status).json(data);
  } catch (error) {
    return response.status(502).json({ error: "Failed to reach the Anthropic API" });
  }
}
