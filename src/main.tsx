import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { readStoredState } from "./lib/chat"
import "./index.css"

// Apply the saved theme before the first paint so the app doesn't flash the
// default light palette while React mounts.
try {
  const saved = JSON.parse(readStoredState() || "")
  document.documentElement.dataset.theme = saved?.settings?.theme ?? "system"
  document.documentElement.dataset.accent = saved?.settings?.accent ?? "indigo"
} catch {
  document.documentElement.dataset.theme = "system"
  document.documentElement.dataset.accent = "indigo"
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
