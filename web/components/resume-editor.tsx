"use client"

import React, { useState, useCallback, useEffect } from "react"
import useSWR from "swr"
import { Input } from "@/components/ui/input"
import JsonEditor from "@/components/json-editor"
import { saveResumeContent, fetchResumeData } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import CodeEditor from "@/components/code-editor"

const fetcher = async (resumeId) => {
  return await fetchResumeData(resumeId)
}

const ResumeEditor = ({ resumeId }) => {
  const { data: resume, mutate } = useSWR(resumeId, fetcher, {
    revalidateOnFocus: false,
  })
  const { toast } = useToast()
  const [localMarkup, setLocalMarkup] = useState("")

  // Update local markup when resume data changes
  useEffect(() => {
    if (resume && resume.markup !== localMarkup) {
      setLocalMarkup(resume.markup || "")
    }
  }, [resume, localMarkup])

  const handleSave = useCallback(
    async (markup) => {
      try {
        await saveResumeContent(
          resumeId,
          resume.name,
          JSON.stringify(resume.content, null, 2),
          markup
        )
        await mutate({ ...resume, markup }, false) // Optimistically update the UI
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
    },
    [resumeId, resume?.name, resume?.content, mutate, toast]
  )

  const handleSaveJson = useCallback(
    async (jsonContent) => {
      try {
        await saveResumeContent(
          resumeId,
          resume.name,
          JSON.stringify(jsonContent, null, 2),
          localMarkup
        )
        await mutate({ ...resume, content: jsonContent }, false) // Optimistically update the UI
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
    },
    [resumeId, resume?.name, localMarkup, mutate, toast]
  )

  if (!resume) return <p>Loading...</p>

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Resume Name"
        name="name"
        value={resume.name}
        onChange={(e) => mutate({ ...resume, name: e.target.value }, false)}
      />
      <JsonEditor initialJson={resume.content} onSave={handleSaveJson} />
      <CodeEditor
        initialMarkup={localMarkup}
        resumeContent={resume.content}
        onSave={handleSave}
      />
    </div>
  )
}

export default ResumeEditor
