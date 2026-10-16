import { Capacitor } from "@capacitor/core"

/** Injected at build time from package.json (kept in sync with the Android versionName). */
export const APP_VERSION =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0"

/** GitHub repository that hosts Logionix releases + the downloadable APK. */
export const RELEASE_REPO = "Redy-rgb/LogionixApp"

export type ReleaseInfo = {
  version: string
  notes: string
  downloadUrl: string
  pageUrl: string
}

type GithubAsset = {
  name?: string
  browser_download_url?: string
}

function toParts(version: string): number[] {
  return version
    .replace(/^v/i, "")
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10) || 0)
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const next = toParts(candidate)
  const now = toParts(current)
  for (let index = 0; index < Math.max(next.length, now.length); index += 1) {
    const left = next[index] ?? 0
    const right = now[index] ?? 0
    if (left !== right) return left > right
  }
  return false
}

/** Fetch the newest published GitHub release, or null when none exist yet. */
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  const response = await fetch(
    `https://api.github.com/repos/${RELEASE_REPO}/releases/latest`,
    { headers: { Accept: "application/vnd.github+json" } },
  )
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`)

  const data = (await response.json()) as {
    tag_name?: string
    name?: string
    body?: string
    html_url?: string
    assets?: GithubAsset[]
  }
  const asset = (data.assets ?? []).find((entry) =>
    String(entry.name ?? "")
      .toLowerCase()
      .endsWith(".apk"),
  )
  const tag = data.tag_name || data.name || ""

  return {
    version: tag.replace(/^v/i, ""),
    notes: (data.body ?? "").trim().split("\n").slice(0, 8).join("\n"),
    downloadUrl: asset?.browser_download_url ?? "",
    pageUrl: data.html_url ?? `https://github.com/${RELEASE_REPO}/releases`,
  }
}

/** Returns the newer release when one is available, otherwise null. */
export async function checkForUpdate(
  current: string,
): Promise<ReleaseInfo | null> {
  const latest = await fetchLatestRelease()
  if (latest?.version && isNewerVersion(latest.version, current)) return latest
  return null
}

/** Open a release asset in the system browser so the phone can download the APK. */
export function openDownload(url: string) {
  if (!url) return
  window.open(
    url,
    Capacitor.isNativePlatform() ? "_system" : "_blank",
    "noopener",
  )
}
