import React from "react"
import { CodeMirror } from "@/components/live-runner"

const CodeEditor = ({ initialMarkup, onSave, onChange }) => {
  return (
    <div className="flex flex-col h-full">
      <CodeMirror
        value={initialMarkup}
        padding={16}
        showLineNumbers
        language="jsx"
        onChange={onChange}
      />
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded mt-4 self-end"
        onClick={() => onSave(initialMarkup)}
      >
        Save Markup
      </button>
    </div>
  )
}

export default CodeEditor
