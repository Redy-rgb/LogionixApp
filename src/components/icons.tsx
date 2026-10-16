import type { ReactNode, SVGProps } from "react"

export type IconProps = SVGProps<SVGSVGElement>

export const Icon = ({
  children,
  ...props
}: IconProps & { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    viewBox="0 0 24 24"
    width="20"
    {...props}
  >
    {children}
  </svg>
)

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="m16.5 16.5 4 4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const SettingsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.53-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.06 1.53 1.7 1.7 0 0 0 1.88-.34L17 4.2 19.8 7l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.6.83 1 1.53 1H21v4h-.08c-.68 0-1.27.4-1.52 1Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.55"
    />
  </Icon>
)
export const SendIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m21 3-7.5 18-3.3-7.2L3 10.5 21 3Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="m10.2 13.8 4.2-4.2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const StopIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.4" fill="currentColor" />
  </Icon>
)
export const MessageIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M20 15a3 3 0 0 1-3 3H8l-5 3V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)
export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m6 6 12 12M18 6 6 18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const ChevronIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m8 10 4 4 4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 3c.5 4.8 3.2 7.5 8 8-4.8.5-7.5 3.2-8 8-.5-4.8-3.2-7.5-8-8 4.8-.5 7.5-3.2 8-8Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)
export const MarkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 4.5 18.5 8.25 18.5 15.75 12 19.5 5.5 15.75 5.5 8.25Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="M10 8.6V15.2H14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect
      x="9"
      y="9"
      width="11"
      height="11"
      rx="2.2"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.7"
    />
  </Icon>
)
export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m5 12.5 4.5 4.5L19 7"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </Icon>
)
export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 5v14m0 0 5.5-5.5M12 19l-5.5-5.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const UndoIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M9 7H16a4.5 4.5 0 0 1 0 9H6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="m9 7-3 3 3 3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 8.5v4.5m0 3.2v.1"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.9"
    />
    <path
      d="M10.4 3.9 2.6 17.5A1.8 1.8 0 0 0 4.2 20.2h15.6a1.8 1.8 0 0 0 1.6-2.7L13.6 3.9a1.8 1.8 0 0 0-3.2 0Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)
export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 4v10m0 0 4-4m-4 4-4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M5 18.5h14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="M23 4v6h-6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)
