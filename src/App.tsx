import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"

import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core"

import { FormattedMessage } from "./components/Markdown"
import { SettingsModal } from "./components/SettingsModal"
import { Sidebar } from "./components/Sidebar"
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  CopyIcon,
  MarkIcon,
  MenuIcon,
  SendIcon,
  StopIcon,
  TrashIcon,
  UndoIcon,
} from "./components/icons"
import { friendlyError, MissingApiKeyError, requestCompletion } from "./lib/api"
import {
  createChat,
  loadState,
  modelLabel,
  STORAGE_KEY,
  titleFromMessage,
  uid,
} from "./lib/chat"
import { useCopy } from "./lib/clipboard"
import type { Chat, Message, Provider, Settings, Theme } from "./lib/types"
import {
  APP_VERSION,
  checkForUpdate,
  openDownload,
  type ReleaseInfo,
} from "./lib/updates"

type Toast = {
  chat: Chat
  index: number
}

function resolvedTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MessageItem({ message }: { message: Message }) {
  const { copied, copy } = useCopy()
  return (
    <article className={`message ${message.role}`}>
      <div className="message-body">
        <div className="message-meta">
          <strong>{message.role === "assistant" ? "Logionix" : "You"}</strong>
          <span>{timeLabel(message.createdAt)}</span>
          <button
            aria-label={copied ? "Message copied" : "Copy message"}
            className={`message-copy ${copied ? "copied" : ""}`}
            onClick={() => void copy(message.content)}
            type="button"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        <div className="message-content">
          <FormattedMessage content={message.content} />
        </div>
      </div>
    </article>
  )
}

function App() {
  const initial = useMemo(loadState, [])
  const [chats, setChats] = useState<Chat[]>(initial.chats)
  const [activeChatId, setActiveChatId] = useState(
    initial.activeChatId || initial.chats[0].id,
  )
  const [settings, setSettings] = useState<Settings>(initial.settings)
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [sending, setSending] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [error, setError] = useState("")
  const [errorNeedsSettings, setErrorNeedsSettings] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [availableUpdate, setAvailableUpdate] = useState<ReleaseInfo | null>(
    null,
  )
  const [atBottom, setAtBottom] = useState(true)
  const [status, setStatus] = useState("")

  const listRef = useRef<HTMLElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const atBottomRef = useRef(true)
  const undoTimer = useRef<number | undefined>(undefined)

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0]
  const activeProvider =
    settings.providers.find(
      (provider) => provider.id === activeChat?.providerId,
    ) || settings.providers[0]
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const configuredCount = settings.providers.filter((provider) =>
    provider.apiKey.trim(),
  ).length

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chats, activeChatId, settings }),
    )
  }, [chats, activeChatId, settings])

  useEffect(() => {
    const theme = resolvedTheme(settings.theme)
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.dataset.accent = settings.accent
    if (Capacitor.isNativePlatform()) {
      void SystemBars.setStyle({
        style: theme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch(() => undefined)
    }
  }, [settings.theme, settings.accent])

  useEffect(() => {
    if (atBottomRef.current)
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [activeChat?.messages, sending])

  useEffect(() => {
    atBottomRef.current = true
    setAtBottom(true)
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight }),
    )
  }, [activeChatId])

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        startNewChat()
        return
      }
      if (event.key === "Escape") {
        if (settingsOpen) setSettingsOpen(false)
        else if (modelMenuOpen) setModelMenuOpen(false)
        else if (sidebarOpen) setSidebarOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  useEffect(() => () => window.clearTimeout(undoTimer.current), [])

  useEffect(() => {
    let cancelled = false
    checkForUpdate(APP_VERSION)
      .then((release) => {
        if (!cancelled) setAvailableUpdate(release)
      })
      .catch(() => {
        // Silent: update checks should never interrupt the app.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateChat = (id: string, update: Partial<Chat>) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === id ? { ...chat, ...update, updatedAt: Date.now() } : chat,
      ),
    )
  }

  const startNewChat = () => {
    const provider = settings.providers[0]
    const chat = createChat(provider.id, provider.models[0] || "")
    setChats((current) => [chat, ...current])
    setActiveChatId(chat.id)
    setSidebarOpen(false)
    setError("")
    setErrorNeedsSettings(false)
  }

  const deleteChat = (id: string) => {
    const index = chats.findIndex((chat) => chat.id === id)
    if (index === -1) return
    const removed = chats[index]
    const remaining = chats.filter((chat) => chat.id !== id)

    if (!remaining.length) {
      const next = createChat(
        settings.providers[0].id,
        settings.providers[0].models[0],
      )
      setChats([next])
      setActiveChatId(next.id)
    } else {
      setChats(remaining)
      if (activeChatId === id) setActiveChatId(remaining[0].id)
    }

    setToast({ chat: removed, index })
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setToast(null), 5000)
  }

  const undoDelete = () => {
    if (!toast) return
    setChats((current) => {
      const next = [...current]
      next.splice(Math.min(toast.index, next.length), 0, toast.chat)
      return next
    })
    setActiveChatId(toast.chat.id)
    setToast(null)
    window.clearTimeout(undoTimer.current)
  }

  const focusComposer = () => {
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault()
    const content = input.trim()
    if (!content || sending || !activeChat || !activeProvider) return

    setError("")
    setErrorNeedsSettings(false)
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    const userMessage: Message = {
      id: uid(),
      role: "user",
      content,
      createdAt: Date.now(),
    }
    const nextMessages = [...activeChat.messages, userMessage]
    updateChat(activeChat.id, {
      messages: nextMessages,
      title: activeChat.messages.length
        ? activeChat.title
        : titleFromMessage(content),
    })
    setSending(true)
    setStatus("Logionix is responding")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await requestCompletion(
        activeProvider,
        activeChat.model,
        nextMessages,
        settings.systemPrompt,
        settings.temperature,
        controller.signal,
      )
      const assistantMessage: Message = {
        id: uid(),
        role: "assistant",
        content: result,
        createdAt: Date.now(),
      }
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : chat,
        ),
      )
      setStatus(result.slice(0, 160))
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        setStatus("Response stopped")
      } else {
        setError(friendlyError(requestError, activeProvider))
        setErrorNeedsSettings(
          requestError instanceof MissingApiKeyError ||
            !activeProvider.apiKey.trim(),
        )
        setStatus("Something went wrong")
      }
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }

  const cancelRequest = () => {
    abortRef.current?.abort()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const handleComposerInput = (value: string) => {
    setInput(value)
    const node = textareaRef.current
    if (node) {
      node.style.height = "auto"
      node.style.height = `${Math.min(node.scrollHeight, 140)}px`
    }
  }

  const handleScroll = () => {
    const node = listRef.current
    if (!node) return
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight
    const nextAtBottom = distance < 96
    atBottomRef.current = nextAtBottom
    setAtBottom(nextAtBottom)
  }

  const updateProvider = (id: string, patch: Partial<Provider>) => {
    setSettings((current) => ({
      ...current,
      providers: current.providers.map((provider) =>
        provider.id === id ? { ...provider, ...patch } : provider,
      ),
    }))
  }

  const addProvider = (draft: {
    name: string
    baseUrl: string
    models: string
  }) => {
    const provider: Provider = {
      id: `custom-${uid()}`,
      name: draft.name.trim(),
      apiKey: "",
      baseUrl: draft.baseUrl.trim(),
      models: draft.models
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean),
      custom: true,
    }
    setSettings((current) => ({
      ...current,
      providers: [...current.providers, provider],
    }))
  }

  const removeProvider = (id: string) => {
    setSettings((current) => ({
      ...current,
      providers: current.providers.filter((provider) => provider.id !== id),
    }))
  }

  const openSettings = () => {
    setSettingsOpen(true)
    setSidebarOpen(false)
  }

  if (!activeChat || !activeProvider) return null

  return (
    <div className="app-shell">
      <Sidebar
        activeChatId={activeChatId}
        chats={filteredChats}
        configuredCount={configuredCount}
        onClose={() => setSidebarOpen(false)}
        onDeleteChat={deleteChat}
        onNewChat={startNewChat}
        onOpenSettings={openSettings}
        onSearchChange={setSearch}
        onSelectChat={(id) => {
          setActiveChatId(id)
          setSidebarOpen(false)
          setError("")
        }}
        open={sidebarOpen}
        providerCount={settings.providers.length}
        search={search}
      />

      <main className="main-panel">
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>

        <header className="top-bar">
          <button
            className="icon-button menu-button"
            onClick={() => setSidebarOpen(true)}
            title="Open menu"
            type="button"
          >
            <MenuIcon />
          </button>

          {modelMenuOpen && (
            <button
              aria-label="Close model selector"
              className="selector-scrim"
              onClick={() => setModelMenuOpen(false)}
              type="button"
            />
          )}
          <div className="model-island">
            <button
              aria-expanded={modelMenuOpen}
              className="model-trigger"
              onClick={() => setModelMenuOpen((open) => !open)}
              type="button"
            >
              <span className="model-trigger-label">
                {modelLabel(activeChat.model)}
              </span>
              <ChevronIcon />
            </button>
            {modelMenuOpen && (
              <div className="model-menu">
                <div className="model-menu-label">Select model</div>
                {settings.providers.map((provider) => (
                  <div className="model-group" key={provider.id}>
                    <div className="model-group-name">
                      <span>{provider.name.charAt(0)}</span>
                      {provider.name}
                    </div>
                    <div className="model-options">
                      {provider.models.map((model) => {
                        const selected =
                          provider.id === activeChat.providerId &&
                          model === activeChat.model
                        return (
                          <button
                            className={selected ? "selected" : ""}
                            key={`${provider.id}-${model}`}
                            onClick={() => {
                              updateChat(activeChat.id, {
                                providerId: provider.id,
                                model,
                              })
                              setModelMenuOpen(false)
                            }}
                            type="button"
                          >
                            <span className="model-option-text">
                              <strong>{modelLabel(model)}</strong>
                              <small>{model}</small>
                            </span>
                            {selected && <span className="model-check">✓</span>}
                          </button>
                        )
                      })}
                      {!provider.models.length && (
                        <div className="no-models">No models added</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {availableUpdate && (
          <div className="update-banner" role="status">
            <MarkIcon />
            <span>Logionix {availableUpdate.version} is available.</span>
            <button
              className="update-banner-action"
              onClick={() => openDownload(availableUpdate.downloadUrl)}
              type="button"
            >
              Download
            </button>
            <button
              aria-label="Dismiss update notice"
              className="error-dismiss"
              onClick={() => setAvailableUpdate(null)}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <section
          className={`messages ${
            activeChat.messages.length ? "" : "messages-empty"
          }`}
          onScroll={handleScroll}
          ref={listRef}
        >
          {!activeChat.messages.length ? (
            <div className="welcome">
              <div className="welcome-icon">
                <MarkIcon />
              </div>
              <p className="eyebrow">NEW CONVERSATION</p>
              <h1>How can I help?</h1>
              <p className="welcome-copy">
                Choose a starting point, or write your own message below.
              </p>
              <div className="suggestion-grid">
                {[
                  ["Plan a project", "Turn a goal into clear next steps"],
                  ["Review my writing", "Improve clarity, tone, and structure"],
                  ["Learn something", "Explain a difficult topic simply"],
                  [
                    "Think through a decision",
                    "Compare options and trade-offs",
                  ],
                ].map(([title, caption], index) => (
                  <button
                    key={title}
                    onClick={() => {
                      setInput(`${title}: `)
                      focusComposer()
                    }}
                    type="button"
                  >
                    <span className="suggestion-number">0{index + 1}</span>
                    <span>
                      <strong>{title}</strong>
                      <small>{caption}</small>
                    </span>
                    <span className="suggestion-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-column">
              {activeChat.messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
              {sending && (
                <article className="message assistant">
                  <div className="typing" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
              )}
            </div>
          )}
        </section>

        {!atBottom && activeChat.messages.length > 0 && (
          <button
            aria-label="Scroll to latest message"
            className="scroll-to-bottom"
            onClick={() =>
              listRef.current?.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: "smooth",
              })
            }
            type="button"
          >
            <ArrowDownIcon />
          </button>
        )}

        <div className="composer-zone">
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              {errorNeedsSettings && (
                <button
                  className="error-action"
                  onClick={() => {
                    setSettingsOpen(true)
                    setError("")
                  }}
                  type="button"
                >
                  Settings
                </button>
              )}
              <button
                aria-label="Dismiss error"
                className="error-dismiss"
                onClick={() => setError("")}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
          )}
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              aria-label="Message"
              onChange={(event) => handleComposerInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={`Message ${activeProvider.name}…`}
              ref={textareaRef}
              rows={1}
              value={input}
            />
            {sending ? (
              <button
                aria-label="Stop response"
                className="send-button stop"
                onClick={cancelRequest}
                type="button"
              >
                <StopIcon />
              </button>
            ) : (
              <button
                aria-label="Send message"
                className="send-button"
                disabled={!input.trim()}
                type="submit"
              >
                <SendIcon />
              </button>
            )}
          </form>
          <p className="composer-note">
            Logionix can make mistakes. Check important information.
            Conversations are saved on this device.
          </p>
        </div>

        {toast && (
          <div className="undo-toast" role="status">
            <TrashIcon />
            <span>Conversation deleted</span>
            <button onClick={undoDelete} type="button">
              <UndoIcon /> Undo
            </button>
          </div>
        )}
      </main>

      <SettingsModal
        onChange={(patch) =>
          setSettings((current) => ({ ...current, ...patch }))
        }
        onAddProvider={addProvider}
        onClose={() => setSettingsOpen(false)}
        onRemoveProvider={removeProvider}
        onUpdateProvider={updateProvider}
        open={settingsOpen}
        settings={settings}
      />
    </div>
  )
}

export default App
