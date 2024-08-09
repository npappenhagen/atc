import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { env } from "@/env.mjs"
import LZString from "lz-string"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export const getHashCode = () => {
  if (typeof location === "undefined") return undefined
  if (location.href.endsWith(location.pathname)) return undefined

  const hash = location.hash.slice(1)
  if (!hash) return ""

  return (
    LZString.decompressFromEncodedURIComponent(hash) || decodeURIComponent(hash)
  )
}

export const updateHash = (code: string) => {
  if (typeof history === "undefined") return

  const hash = code ? LZString.compressToEncodedURIComponent(code) : ""
  history.replaceState(history.state, "", `#${hash}`)
}
