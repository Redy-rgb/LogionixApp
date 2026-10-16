import type { AppState, Chat, Provider, Settings } from "./types"

export const STORAGE_KEY = "logionix-state-v1"

/** Previous key kept so existing installs migrate their saved chats on first load. */
const LEGACY_STORAGE_KEY = "nexus-ai-state-v1"

/** Read persisted state from the current key, falling back to the legacy key. */
export function readStoredState(): string | null {
  return (
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem(LEGACY_STORAGE_KEY)
  )
}

export const defaultProviders: Provider[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      "gemini-3.1-flash-lite",
      "gemini-3.2-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
    ],
  },
  {
    id: "groq",
    name: "Groq",
    apiKey: "",
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKey: "",
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet"],
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    apiKey: "",
    baseUrl: "https://router.huggingface.co/v1",
    models: ["meta-llama/Llama-3.1-8B-Instruct", "Qwen/Qwen2.5-72B-Instruct"],
  },
]

export const defaultSettings: Settings = {
  systemPrompt: "You are a helpful, thoughtful, and concise AI assistant.",
  temperature: 0.7,
  accent: "indigo",
  theme: "system",
  providers: defaultProviders,
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function createChat(
  providerId = "gemini",
  model = defaultProviders[0].models[0],
): Chat {
  const now = Date.now()
  return {
    id: uid(),
    title: "New conversation",
    providerId,
    model,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Turn a provider model id into a human-friendly label, keeping the raw id as a fallback. */
export function modelLabel(model: string): string {
  const short = model.includes("/")
    ? model.slice(model.indexOf("/") + 1)
    : model
  return (
    short
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase()) || model
  )
}

/** Build a short conversation title on a word boundary instead of cutting mid-word. */
export function titleFromMessage(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim()
  if (!clean) return "New conversation"

  const limit = 44
  let title = ""
  for (const word of clean.split(" ")) {
    const candidate = title ? `${title} ${word}` : word
    if (candidate.length > limit) break
    title = candidate
  }
  if (!title) title = clean.slice(0, limit)
  if (title.length < clean.length) title = `${title}…`

  return title.charAt(0).toUpperCase() + title.slice(1)
}

export function loadState(): AppState {
  try {
    const saved = JSON.parse(readStoredState() || "")
    if (saved?.chats?.length && saved?.settings) {
      const settings: Settings = {
        ...defaultSettings,
        ...saved.settings,
        providers: saved.settings.providers?.length
          ? saved.settings.providers
          : defaultProviders,
      }
      return { chats: saved.chats, activeChatId: saved.activeChatId, settings }
    }
  } catch {
    // Start fresh if locally saved data is unavailable or malformed.
  }
  const chat = createChat()
  return { chats: [chat], activeChatId: chat.id, settings: defaultSettings }
}
