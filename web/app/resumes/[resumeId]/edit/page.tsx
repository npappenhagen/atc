"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import JsonEditor from "@/components/json-editor"
import CodeEditor from "@/components/code-editor"
import PreviewOnly from "@/components/preview-only"
import { saveResumeContent, fetchResumeData } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable"
import { useLiveRunner } from "react-live-runner"

const ResumeEditPage = ({ params }: { params: { resumeId: string } }) => {
  const { resumeId } = params
  const [resume, setResume] = useState(null)
  const [markup, setMarkup] = useState("")
  const [jsonContent, setJsonContent] = useState({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const fetchedResume = await fetchResumeData(resumeId)
      setResume(fetchedResume)
      setMarkup(fetchedResume.markup)
      setJsonContent(fetchedResume.content)
    }
    fetchData()
  }, [resumeId])

  const scope = useMemo(
    () => ({
      React,
      resume_values: jsonContent || {},
    }),
    [jsonContent]
  )

  const { element, error, code, onChange } = useLiveRunner({
    initialCode: markup,
    language: "jsx",
    scope,
  })

  const handleSaveJson = useCallback(
    async (updatedJson: any) => {
      try {
        const formattedJson = JSON.stringify(updatedJson, null, 2)
        await saveResumeContent(
          resumeId,
          resume.name,
          formattedJson,
          code // Saving the current code as markup
        )
        setJsonContent(updatedJson)
        toast({
          title: "Success",
          description: "Resume JSON saved successfully.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save resume JSON.",
        })
      }
    },
    [resume, code, resumeId, toast]
  )

  const handleSaveMarkup = useCallback(async () => {
    try {
      await saveResumeContent(
        resumeId,
        resume.name,
        JSON.stringify(jsonContent, null, 2),
        code // Using current code from useLiveRunner
      )
      setMarkup(code)
      toast({
        title: "Success",
        description: "Resume markup saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resume markup.",
      })
    }
  }, [resume, code, jsonContent, resumeId, toast])

  if (!resume) return <p>Loading...</p>

  return (
    <div className="flex flex-col space-y-6 p-6 h-full">
      <Input
        placeholder="Resume Name"
        name="name"
        value={resume.name}
        onChange={(e) =>
          setResume((prev) => ({ ...prev, name: e.target.value }))
        }
        className="mb-4"
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} className="flex flex-col space-y-2">
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={50}>
              <JsonEditor
                initialJson={jsonContent}
                onSave={handleSaveJson}
                onChange={(newJson) => {
                  setJsonContent(newJson)
                  onChange(code) // Re-run live runner with the updated scope
                }}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
              <CodeEditor
                initialMarkup={code}
                onSave={handleSaveMarkup}
                onChange={(newMarkup) => {
                  setMarkup(newMarkup)
                  onChange(newMarkup)
                }}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={40}
          className="bg-white p-4 rounded-lg shadow-md overflow-auto"
        >
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <PreviewOnly element={element} error={error} />
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="flex justify-end space-x-4 mt-4">
        <Button onClick={handleSaveJson}>Save JSON</Button>
        <Button onClick={handleSaveMarkup}>Save Markup</Button>
        <Button onClick={() => router.back()}>Back</Button>
      </div>
    </div>
  )
}

export default ResumeEditPage
