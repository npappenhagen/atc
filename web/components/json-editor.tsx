import React from "react"
import { CodeMirror } from "@/components/live-runner"

const JsonEditor = ({ initialJson, onChange }) => {
  const handleJsonChange = (value) => {
    try {
      const parsedJson = JSON.parse(value)
      onChange(parsedJson)
    } catch (error) {
      console.warn("Invalid JSON format:", error)
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
    </div>
  )
}

export default JsonEditor
