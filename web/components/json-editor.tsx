import React, { useState, useEffect, useCallback } from "react"
// import { CodeMirror } from "react-live-runner"
import { CodeMirror } from "@/components/live-runner"

export const JsonEditor = ({ initialJson, onSave }) => {
  const [jsonContent, setJsonContent] = useState("")

  // Initialize the JSON content state when the component mounts or when the initialJson changes
  useEffect(() => {
    if (initialJson) {
      setJsonContent(JSON.stringify(initialJson, null, 2))
    }
  }, [initialJson])

  // Handle JSON changes in the editor
  const handleJsonChange = (value) => {
    setJsonContent(value)
  }

  // Handle the save action
  const handleSave = () => {
    try {
      const parsedJson = JSON.parse(jsonContent)
      onSave(parsedJson) // Pass the parsed JSON back to the parent component
    } catch (error) {
      console.error("Invalid JSON format:", error)
      // Optionally handle invalid JSON format (e.g., show an error message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <CodeMirror
        value={jsonContent}
        language="json"
        padding={16}
        showLineNumbers
        onChange={handleJsonChange}
      />
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
        onClick={handleSave}
      >
        Save JSON
      </button>
    </div>
  )
}

export default JsonEditor
