export type Role = "user" | "assistant"
export type ProviderId = "gemini" | "groq" | "openrouter" | "huggingface" | string
export type Theme = "light" | "dark" | "system"

export type Message = {
  id: string
  role: Role
  content: string
  createdAt: number
}

export type Chat = {
  id: string
  title: string
  providerId: ProviderId
  model: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export type Provider = {
  id: ProviderId
  name: string
  apiKey: string
  baseUrl: string
  models: string[]
  custom?: boolean
}

export type Settings = {
  systemPrompt: string
  temperature: number
  accent: string
  theme: Theme
  providers: Provider[]
}

export type AppState = {
  chats: Chat[]
  activeChatId: string
  settings: Settings
}
