"use client"

import React, { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { Input } from "@/components/ui/input"
import JsonEditor from "@/components/json-editor"
import CodeEditor from "@/components/code-editor"
import PreviewOnly from "@/components/preview-only"
import { saveResumeContent, fetchResumeData } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"

const fetcher = async (resumeId) => {
  return await fetchResumeData(resumeId)
}

const ResumeEditor = ({ resumeId }) => {
  const { data: resume, mutate } = useSWR(resumeId, fetcher, {
    revalidateOnFocus: false,
  })
  const { toast } = useToast()

  const [jsonContent, setJsonContent] = useState({})
  const [markup, setMarkup] = useState("")

  useEffect(() => {
    if (resume) {
      setJsonContent(resume.content)
      setMarkup(resume.markup)
    }
  }, [resume])

  const handleSaveJson = async (jsonContent) => {
    try {
      const updatedResume = {
        ...resume,
        content: jsonContent,
        markup,
      }
      await saveResumeContent(
        resumeId,
        updatedResume.name,
        JSON.stringify(jsonContent, null, 2), // Ensure JSON string is correctly formatted
        markup
      )
      mutate(updatedResume, false)
      toast({
        title: "Success",
        description: "Resume JSON saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save resume JSON:", error)
      toast({
        title: "Error",
        description: "Failed to save resume JSON.",
      })
    }
  }

  const handleSaveMarkup = async (markup) => {
    try {
      const updatedResume = {
        ...resume,
        content: jsonContent,
        markup,
      }
      await saveResumeContent(
        resumeId,
        updatedResume.name,
        JSON.stringify(jsonContent, null, 2),
        markup
      )
      mutate(updatedResume, false)
      toast({
        title: "Success",
        description: "Resume markup saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save resume markup:", error)
      toast({
        title: "Error",
        description: "Failed to save resume markup.",
      })
    }
  }

  if (!resume) return <p>Loading...</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-screen">
      <div className="col-span-2 flex flex-col space-y-4">
        <Input
          placeholder="Resume Name"
          name="name"
          value={resume.name}
          onChange={(e) => mutate({ ...resume, name: e.target.value }, false)}
          className="mb-4"
        />

        <div className="flex-1 flex flex-col">
          <JsonEditor
            initialJson={jsonContent}
            onSave={handleSaveJson}
            className="flex-1"
          />
        </div>

        <div className="flex-1 flex flex-col mt-4">
          <CodeEditor
            initialMarkup={markup}
            resumeContent={jsonContent}
            onSave={handleSaveMarkup}
            className="flex-1"
          />
        </div>
      </div>

      <div className="col-span-1 bg-white p-4 rounded-lg shadow-md overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
        <div className="h-full">
          <PreviewOnly markup={markup} resumeContent={jsonContent} />
        </div>
      </div>
    </div>
  )
}

export default ResumeEditor
