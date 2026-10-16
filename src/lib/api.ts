import type { Message, Provider } from "./types"

export class MissingApiKeyError extends Error {
  constructor(providerName: string) {
    super(
      `Add your ${providerName} API key in Settings before sending a message.`,
    )
    this.name = "MissingApiKeyError"
  }
}

export async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return (
      body.error?.message ||
      body.error ||
      body.message ||
      `Request failed (${response.status})`
    )
  } catch {
    return `Request failed (${response.status})`
  }
}

/** Translate low-level failures into a message a person can act on. */
export function friendlyError(error: unknown, provider: Provider): string {
  if (error instanceof MissingApiKeyError) return error.message

  const message = error instanceof Error ? error.message : ""

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return `Couldn't reach ${provider.name}. Check your connection and API key, or try again in a moment.`
  }
  if (/401|403|invalid api key|unauthorized|permission/i.test(message)) {
    return `${provider.name} rejected the request. Double-check your API key and its permissions.`
  }
  if (/429|rate limit|quota/i.test(message)) {
    return `${provider.name} is rate limiting requests right now. Wait a moment and try again.`
  }

  return message || "Something went wrong. Please try again."
}

export async function requestCompletion(
  provider: Provider,
  model: string,
  messages: Message[],
  systemPrompt: string,
  temperature: number,
  signal?: AbortSignal,
): Promise<string> {
  if (!provider.apiKey.trim()) {
    throw new MissingApiKeyError(provider.name)
  }

  if (provider.id === "gemini") {
    const response = await fetch(
      `${provider.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(provider.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          generationConfig: { temperature },
        }),
      },
    )
    if (!response.ok) throw new Error(await parseError(response))
    const data = await response.json()
    return (
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("") || "No response was returned."
    )
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  }
  if (provider.id === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin
    headers["X-Title"] = "Logionix"
  }

  const response = await fetch(
    `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(({ role, content }) => ({ role, content })),
        ],
      }),
    },
  )
  if (!response.ok) throw new Error(await parseError(response))
  const data = await response.json()
  return data.choices?.[0]?.message?.content || "No response was returned."
}
