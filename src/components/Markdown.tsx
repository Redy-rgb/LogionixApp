import type { ReactNode } from "react"

import { useCopy } from "../lib/clipboard"
import { CheckIcon, CopyIcon } from "./icons"

const inlinePattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
const urlPattern = /(https?:\/\/[^\s<]+)/g

function linkify(text: string, keyPrefix: string): ReactNode[] {
  return text.split(urlPattern).map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          href={part}
          key={`${keyPrefix}-u${index}`}
          rel="noreferrer"
          target="_blank"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

function InlineContent({ text }: { text: string }) {
  const parts = text.split(inlinePattern)
  return (
    <>
      {parts.map((part, index) => {
        const key = `i${index}`
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={key}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={key}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={key}>{part.slice(1, -1)}</code>
        }
        if (part.startsWith("[") && part.includes("](")) {
          const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
          if (match) {
            const [, label, href] = match
            const safe = /^(https?:|mailto:)/i.test(href)
              ? href
              : `https://${href.replace(/^\/+/, "")}`
            return (
              <a href={safe} key={key} rel="noreferrer" target="_blank">
                {label}
              </a>
            )
          }
        }
        return <span key={key}>{linkify(part, key)}</span>
      })}
    </>
  )
}

type CodeBlockProps = {
  language: string
  code: string
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const { copied, copy } = useCopy()
  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span className="code-language">{language || "code"}</span>
        <button
          aria-label={copied ? "Copied" : "Copy code"}
          className="code-copy"
          onClick={() => void copy(code)}
          type="button"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code>{code.trimEnd()}</code>
      </pre>
    </div>
  )
}

export function FormattedMessage({ content }: { content: string }) {
  const sections = content.split(/```([\s\S]*?)```/g)
  return (
    <div className="formatted-message">
      {sections.map((section, sectionIndex) => {
        if (sectionIndex % 2 === 1) {
          const lines = section.replace(/^\n/, "").split("\n")
          const hasLanguage = /^[a-zA-Z0-9_+#.-]+$/.test(lines[0]?.trim() || "")
          const language = hasLanguage ? (lines.shift() || "").trim() : ""
          return (
            <CodeBlock
              code={lines.join("\n")}
              key={sectionIndex}
              language={language}
            />
          )
        }

        return section.split("\n").map((line, lineIndex) => {
          const trimmed = line.trim()
          const key = `${sectionIndex}-${lineIndex}`
          if (!trimmed) return <div className="text-spacer" key={key} />
          if (trimmed.startsWith("### "))
            return (
              <h4 key={key}>
                <InlineContent text={trimmed.slice(4)} />
              </h4>
            )
          if (trimmed.startsWith("## "))
            return (
              <h3 key={key}>
                <InlineContent text={trimmed.slice(3)} />
              </h3>
            )
          if (trimmed.startsWith("# "))
            return (
              <h2 key={key}>
                <InlineContent text={trimmed.slice(2)} />
              </h2>
            )
          if (/^[-*] /.test(trimmed))
            return (
              <div className="list-line" key={key}>
                <span>•</span>
                <p>
                  <InlineContent text={trimmed.slice(2)} />
                </p>
              </div>
            )
          if (/^\d+\. /.test(trimmed)) {
            const [number, ...rest] = trimmed.split(" ")
            return (
              <div className="list-line" key={key}>
                <span>{number}</span>
                <p>
                  <InlineContent text={rest.join(" ")} />
                </p>
              </div>
            )
          }
          if (trimmed.startsWith("> "))
            return (
              <blockquote key={key}>
                <InlineContent text={trimmed.slice(2)} />
              </blockquote>
            )
          return (
            <p key={key}>
              <InlineContent text={line} />
            </p>
          )
        })
      })}
    </div>
  )
}
