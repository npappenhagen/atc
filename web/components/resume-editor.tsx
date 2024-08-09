"use client"

import React, { useState, useEffect } from "react"
import { useLiveRunner } from "react-live-runner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CodeMirror,
  Preview,
  PreviewContainer,
  PreviewError,
} from "@/components/live-runner"
import { updateResume, fetchResumeContent } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

const ResumeEditor = ({ userId, resumeId: rId }) => {
  const [resumeId, setResumeId] = useState(rId)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [markup, setMarkup] = useState("")
  const { toast } = useToast()

  const { element, error, code, onChange } = useLiveRunner({
    initialCode: markup,
    language: "jsx",
  })

  useEffect(() => {
    const loadData = async () => {
      if (resumeId) {
        const { content, markup, name } = await fetchResumeContent(resumeId)
        setContent(JSON.stringify(content, null, 2))
        setMarkup(markup)
        onChange(markup)
        setName(name)
      }
    }
    loadData()
  }, [resumeId, onChange])

  const handleSave = async () => {
    try {
      await updateResume(resumeId, name, content, markup)
      toast({
        title: "Success",
        description: "Resume saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resume.",
      })
    }
  }

  const handleContentChange = (e) => {
    try {
      const formatted = JSON.stringify(JSON.parse(e.target.value), null, 2)
      setContent(formatted)
    } catch (error) {
      setContent(e.target.value) // If JSON is invalid, keep raw input
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Resume Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        placeholder="Resume Content (JS*N)"
        name="content"
        value={content}
        onChange={handleContentChange}
      />

      {/*<textarea*/}
      {/*  placeholder="Resume Content (JSON   ) "*/}
      {/*  className="h-32 p-2 border border-gray-300 rounded-md"*/}
      {/*  value={content}*/}
      {/*  onChange={(e) => setContent(e.target.value)}*/}
      {/*/>*/}
      <div className="h-64">
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
      <div>
        <PreviewContainer>
          <Preview>{element}</Preview>
          {error && <PreviewError>{error}</PreviewError>}
        </PreviewContainer>
      </div>
      <Button className="mt-4" onClick={handleSave}>
        Save
      </Button>
    </div>
  )
}

export default ResumeEditor
