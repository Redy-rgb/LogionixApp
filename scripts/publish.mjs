import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const REPO = "Redy-rgb/LogionixApp"
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN

if (!token) {
  console.error("Set GH_TOKEN (repo scope) to publish a release.")
  process.exit(1)
}

const version = JSON.parse(
  readFileSync(resolve("package.json"), "utf8"),
).version
const tag = `v${version}`
const assetName = `Logionix-${version}.apk`
const apkPath = resolve("artifacts", assetName)

if (!existsSync(apkPath)) {
  console.error(`Missing ${apkPath}. Build it with \`pnpm android:apk\` first.`)
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "logionix-publish",
  "X-GitHub-Api-Version": "2022-11-28",
}

const release = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    tag_name: tag,
    name: `Logionix ${version}`,
    body: `Logionix ${version} APK. Download and install to update.`,
    draft: false,
  }),
}).then(async (response) => {
  if (!response.ok) {
    throw new Error(`GitHub ${response.status}: ${await response.text()}`)
  }
  return response.json()
})

const asset = await fetch(
  `https://uploads.github.com/repos/${REPO}/releases/${release.id}/assets?name=${assetName}`,
  {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/vnd.android.package-archive",
    },
    body: readFileSync(apkPath),
  },
).then(async (response) => {
  if (!response.ok) {
    throw new Error(`Upload ${response.status}: ${await response.text()}`)
  }
  return response.json()
})

console.log(`Published ${tag}: ${asset.browser_download_url}`)
