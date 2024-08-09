import React from "react"
import { LiveProvider, LiveError, LivePreview, LiveEditor } from "react-live"
import { type Language } from "prism-react-renderer"
// import theme from "prism-react-renderer/themes/vsDark"
import { Button } from "@/components/ui/button"

export default function CodeBlock({ children, className, live }: any) {
  const language = className.replace(/language-/, "")
  const code = children.replace(/\n$/, "")
  const codeBlock = <code>Render Non-interactive code here...</code>

  if (live) {
    return (
      <LiveProvider code={code} scope={{ Button }}>
        <LivePreview />
        <LiveError />
        <LiveEditor code={code} language={language} />
      </LiveProvider>
    )
  }

  return codeBlock
}
