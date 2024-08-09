import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useLiveRunner } from "react-live-runner"
import {
  CodeMirror,
  Preview,
  PreviewContainer,
  PreviewError,
} from "@/components/live-runner"

const CodeEditor = ({ initialMarkup, resumeContent, onSave }) => {
  const [markup, setMarkup] = useState(initialMarkup || "")

  // Memoize the scope to prevent unnecessary re-renders
  const scope = useMemo(
    () => ({
      React,
      resume_values: resumeContent || {},
    }),
    [resumeContent]
  )

  const { element, error, onChange } = useLiveRunner({
    initialCode: markup,
    language: "jsx",
    scope,
  })

  const handleChange = useCallback(
    (value) => {
      setMarkup(value)
      onChange(value) // This is the main interaction with react-live-runner
    },
    [onChange]
  )

  const handleSave = useCallback(() => {
    onSave(markup)
  }, [markup, onSave])

  // Ensure markup is only updated if the initialMarkup changes
  useEffect(() => {
    if (initialMarkup && initialMarkup !== markup) {
      setMarkup(initialMarkup)
      onChange(initialMarkup)
    }
  }, [initialMarkup])

  return (
    <div className="h-64">
      <CodeMirror
        value={markup}
        padding={16}
        showLineNumbers
        onChange={handleChange}
      />
      <div>
        <PreviewContainer>
          <Preview>{element}</Preview>
          {error && <PreviewError>{error}</PreviewError>}
        </PreviewContainer>
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  )
}

export default CodeEditor
