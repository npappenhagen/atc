import React from "react"
import { CodeMirror } from "@/components/live-runner"

const JsonEditor = ({ initialJson, onSave, onChange }) => {
  const handleJsonChange = (value) => {
    try {
      const parsedJson = JSON.parse(value)
      onChange(parsedJson)
    } catch (error) {
      console.error("Invalid JSON format:", error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <CodeMirror
        value={JSON.stringify(initialJson, null, 2)}
        padding={16}
        showLineNumbers
        language="json"
        onChange={handleJsonChange}
      />
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded mt-4 self-end"
        onClick={() => onSave(initialJson)}
      >
        Save JSON
      </button>
    </div>
  )
}

export default JsonEditor
