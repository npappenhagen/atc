"use client"

import React, { useEffect, useState } from "react"
import { useLiveRunner } from "react-live-runner"
import styled from "styled-components"
import {
  CodeMirror,
  Preview,
  PreviewContainer,
  PreviewError,
} from "@/components/live-runner"
import { saveResumeContent, fetchResumeContent } from "@/app/actions"
import "./styles.css"

const Container = styled.div`
  display: flex;
  flex-direction: row;
  overflow: hidden;
`

export const scope = {
  React,
  styled,
}

const Playground = ({ resumeId }) => {
  const [content, setContent] = useState("")
  const [markup, setMarkup] = useState("")

  const { element, error, code, onChange } = useLiveRunner({
    initialCode: markup,
    scope,
    language: "jsx",
  })

  useEffect(() => {
    const loadData = async () => {
      if (resumeId) {
        const { content, markup } = await fetchResumeContent(resumeId)
        setContent(content)
        setMarkup(markup)
        onChange(markup)
      }
    }
    loadData()
  }, [resumeId, onChange])

  const handleAutoSave = async () => {
    if (resumeId && content && markup) {
      await saveResumeContent(resumeId, content, markup)
    }
  }

  // Autosave functionality
  useEffect(() => {
    const interval = setInterval(handleAutoSave, 60000)
    return () => clearInterval(interval)
  }, [markup])

  return (
    <Container>
      <div className="w-1/2">
        <CodeMirror
          value={code}
          padding={16}
          showLineNumbers
          onChange={(value) => {
            setMarkup(value)
            onChange(value)
          }}
        />
      </div>
      <div className="w-1/2">
        <PreviewContainer>
          <Preview>{element}</Preview>
          {error && <PreviewError>{error}</PreviewError>}
        </PreviewContainer>
      </div>
    </Container>
  )
}

export default Playground
