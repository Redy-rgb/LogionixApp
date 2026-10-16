import { useEffect, useRef, useState, type KeyboardEvent } from "react"

import type { Provider, Settings, Theme } from "../lib/types"
import {
  APP_VERSION,
  checkForUpdate,
  openDownload,
  type ReleaseInfo,
} from "../lib/updates"
import {
  ChevronIcon,
  CloseIcon,
  DownloadIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from "./icons"

type SettingsModalProps = {
  open: boolean
  settings: Settings
  onClose: () => void
  onChange: (patch: Partial<Settings>) => void
  onUpdateProvider: (id: string, patch: Partial<Provider>) => void
  onAddProvider: (provider: {
    name: string
    baseUrl: string
    models: string
  }) => void
  onRemoveProvider: (id: string) => void
}

const accents = ["indigo", "blue", "teal", "rose", "amber"]
const themes: Theme[] = ["light", "dark", "system"]
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

type UpdateOutcome = "idle" | "latest" | "available" | "error"

export function SettingsModal({
  open,
  settings,
  onClose,
  onChange,
  onUpdateProvider,
  onAddProvider,
  onRemoveProvider,
}: SettingsModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState({ name: "", baseUrl: "", models: "" })
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState<UpdateOutcome>("idle")
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [updateError, setUpdateError] = useState("")

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => previouslyFocused?.focus?.()
  }, [open])

  if (!open) return null

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !panelRef.current) return
    const nodes = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((node) => node.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const submitProvider = () => {
    if (!draft.name.trim() || !draft.baseUrl.trim()) return
    onAddProvider(draft)
    setDraft({ name: "", baseUrl: "", models: "" })
  }

  const checkUpdates = async () => {
    setChecking(true)
    setOutcome("idle")
    setUpdateError("")
    try {
      const found = await checkForUpdate(APP_VERSION)
      if (found) {
        setRelease(found)
        setOutcome("available")
      } else {
        setOutcome("latest")
      }
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : "Update check failed",
      )
      setOutcome("error")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <button
        aria-label="Close settings"
        className="modal-scrim"
        onClick={onClose}
        type="button"
      />
      <div className="settings-panel" onKeyDown={handleKeyDown} ref={panelRef}>
        <div className="settings-header">
          <div>
            <p className="eyebrow">PREFERENCES</p>
            <h2>Settings</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            title="Close settings"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <div className="section-heading">
              <h3>Assistant behavior</h3>
              <p>Shape how responses are written and delivered.</p>
            </div>
            <label className="field">
              <span>System prompt</span>
              <textarea
                onChange={(event) =>
                  onChange({ systemPrompt: event.target.value })
                }
                rows={4}
                value={settings.systemPrompt}
              />
            </label>
            <label className="field">
              <span className="range-label">
                <span>Temperature</span>
                <strong>{settings.temperature.toFixed(1)}</strong>
              </span>
              <input
                max="1.5"
                min="0"
                onChange={(event) =>
                  onChange({ temperature: Number(event.target.value) })
                }
                step="0.1"
                type="range"
                value={settings.temperature}
              />
              <small>Lower is focused; higher is more creative.</small>
            </label>
          </section>

          <section className="settings-section">
            <div className="section-heading">
              <h3>Appearance</h3>
              <p>Personalize the look of your workspace.</p>
            </div>
            <div className="field">
              <span>Theme</span>
              <div className="segmented">
                {themes.map((theme) => (
                  <button
                    className={settings.theme === theme ? "selected" : ""}
                    key={theme}
                    onClick={() => onChange({ theme })}
                    type="button"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span>Accent color</span>
              <div className="accent-grid">
                {accents.map((accent) => (
                  <button
                    aria-label={`${accent} accent`}
                    className={`accent-swatch ${accent} ${
                      settings.accent === accent ? "selected" : ""
                    }`}
                    key={accent}
                    onClick={() => onChange({ accent })}
                    type="button"
                  >
                    <span />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-heading">
              <h3>AI providers</h3>
              <p>
                Keys are saved only in this browser. Use restricted keys where
                available.
              </p>
            </div>
            <div className="provider-cards">
              {settings.providers.map((provider) => (
                <details className="provider-card" key={provider.id}>
                  <summary>
                    <span className="provider-dot">
                      {provider.name.charAt(0)}
                    </span>
                    <span>
                      <strong>{provider.name}</strong>
                      <small>
                        {provider.apiKey ? "Configured" : "API key required"}
                      </small>
                    </span>
                    <ChevronIcon />
                  </summary>
                  <div className="provider-fields">
                    <label className="field">
                      <span>API key</span>
                      <input
                        autoComplete="off"
                        onChange={(event) =>
                          onUpdateProvider(provider.id, {
                            apiKey: event.target.value,
                          })
                        }
                        placeholder="Enter API key"
                        type="password"
                        value={provider.apiKey}
                      />
                    </label>
                    <label className="field">
                      <span>Base URL</span>
                      <input
                        autoComplete="off"
                        onChange={(event) =>
                          onUpdateProvider(provider.id, {
                            baseUrl: event.target.value,
                          })
                        }
                        value={provider.baseUrl}
                      />
                    </label>
                    <label className="field">
                      <span>
                        Models <small>comma separated</small>
                      </span>
                      <input
                        autoComplete="off"
                        onChange={(event) =>
                          onUpdateProvider(provider.id, {
                            models: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean),
                          })
                        }
                        value={provider.models.join(", ")}
                      />
                    </label>
                    {provider.custom && (
                      <button
                        className="remove-provider"
                        onClick={() => onRemoveProvider(provider.id)}
                        type="button"
                      >
                        <TrashIcon /> Remove provider
                      </button>
                    )}
                  </div>
                </details>
              ))}
            </div>
            <div className="add-provider">
              <h4>Add OpenAI-compatible provider</h4>
              <div className="form-row">
                <input
                  autoComplete="off"
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  placeholder="Provider name"
                  value={draft.name}
                />
                <input
                  autoComplete="off"
                  onChange={(event) =>
                    setDraft({ ...draft, baseUrl: event.target.value })
                  }
                  placeholder="Base URL"
                  value={draft.baseUrl}
                />
              </div>
              <input
                autoComplete="off"
                onChange={(event) =>
                  setDraft({ ...draft, models: event.target.value })
                }
                placeholder="Models, comma separated"
                value={draft.models}
              />
              <button
                className="secondary-button"
                disabled={!draft.name.trim() || !draft.baseUrl.trim()}
                onClick={submitProvider}
                type="button"
              >
                <PlusIcon /> Add provider
              </button>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-heading">
              <h3>Updates</h3>
              <p>
                Logionix {APP_VERSION} is installed. Check GitHub for a newer
                build, then download the APK straight to your phone.
              </p>
            </div>
            <div className="update-row">
              <span className="update-version">v{APP_VERSION}</span>
              <button
                className="secondary-button"
                disabled={checking}
                onClick={() => void checkUpdates()}
                type="button"
              >
                <RefreshIcon />
                {checking ? "Checking…" : "Check for updates"}
              </button>
            </div>
            {outcome === "latest" && (
              <p className="update-status">You're on the latest version.</p>
            )}
            {outcome === "error" && (
              <p className="update-status error">{updateError}</p>
            )}
            {outcome === "available" && release && (
              <div className="update-card">
                <strong>Version {release.version} is available</strong>
                {release.notes && (
                  <p className="update-notes">{release.notes}</p>
                )}
                <div className="update-actions">
                  <button
                    className="primary-button"
                    onClick={() => openDownload(release.downloadUrl)}
                    type="button"
                  >
                    <DownloadIcon /> Download APK
                  </button>
                  <a
                    className="update-link"
                    href={release.pageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Release notes
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
