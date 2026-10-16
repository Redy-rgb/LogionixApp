import type { Chat } from "../lib/types"
import {
  ChevronIcon,
  CloseIcon,
  MarkIcon,
  MessageIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
} from "./icons"

type SidebarProps = {
  open: boolean
  chats: Chat[]
  activeChatId: string
  search: string
  configuredCount: number
  providerCount: number
  onSearchChange: (value: string) => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  onClose: () => void
}

export function Sidebar({
  open,
  chats,
  activeChatId,
  search,
  configuredCount,
  providerCount,
  onSearchChange,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onOpenSettings,
  onClose,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        aria-label="Conversations"
      >
        <div className="sidebar-top">
          <div className="brand-row">
            <div className="brand-mark">
              <MarkIcon />
            </div>
            <div>
              <div className="brand-name">Logionix</div>
              <div className="brand-caption">Workspace</div>
            </div>
            <button
              className="icon-button sidebar-close"
              onClick={onClose}
              title="Close menu"
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <button className="new-chat-button" onClick={onNewChat} type="button">
            <PlusIcon />
            New conversation
          </button>

          <label className="search-box">
            <SearchIcon />
            <input
              aria-label="Search conversations"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations"
              type="search"
              value={search}
            />
          </label>
        </div>

        <div className="history-label">Recent</div>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              className={`chat-list-item ${
                chat.id === activeChatId ? "active" : ""
              }`}
              key={chat.id}
            >
              <button
                className="chat-select"
                onClick={() => onSelectChat(chat.id)}
                type="button"
              >
                <MessageIcon />
                <span>
                  <strong>{chat.title}</strong>
                  <small>
                    {new Date(chat.updatedAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </span>
              </button>
              <button
                aria-label={`Delete ${chat.title}`}
                className="delete-chat"
                onClick={() => onDeleteChat(chat.id)}
                title="Delete conversation"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          {!chats.length && (
            <div className="empty-search">No conversations found</div>
          )}
        </div>

        <button
          className="settings-button"
          onClick={onOpenSettings}
          type="button"
        >
          <SettingsIcon />
          <span>
            <strong>Settings</strong>
            <small>
              {configuredCount} of {providerCount} providers configured
            </small>
          </span>
          <ChevronIcon />
        </button>
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          className="sidebar-scrim"
          onClick={onClose}
          type="button"
        />
      )}
    </>
  )
}
