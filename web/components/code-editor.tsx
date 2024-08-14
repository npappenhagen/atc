import React from "react"
import { CodeMirror } from "@/components/live-runner"

const CodeEditor = ({ initialMarkup, onChange }) => {
  return (
    <div className="flex flex-col h-full">
      <CodeMirror
        value={initialMarkup}
        padding={16}
        showLineNumbers
        language="jsx"
        onChange={onChange}
      />
    </div>
  )
}

export default CodeEditor
