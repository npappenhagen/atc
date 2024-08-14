"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import JsonEditor from "@/components/json-editor"
import CodeEditor from "@/components/code-editor"
import PreviewOnly from "@/components/preview-only"
import { saveResumeVersion, fetchResumeData } from "@/app/actions"
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
  const [isEditing, setIsEditing] = useState(true)
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
      // injects the json values that the jsx uses into scope.
      resume_values: jsonContent || {},
    }),
    [jsonContent]
  )

  const { element, error, code, onChange } = useLiveRunner({
    initialCode: markup,
    language: "jsx",
    scope,
  })

  const handleSaveResumeVersion = useCallback(async () => {
    try {
      await saveResumeVersion(
        resumeId,
        resume.name,
        JSON.stringify(jsonContent, null, 2),
        code // Using current code from useLiveRunner
      )
      toast({
        title: "Success",
        description: "Version saved successfully.",
      })
    } catch (error) {
      console.warn(
        "handleSaveResumeVersion.error",
        JSON.stringify(error, null, 2)
      )
      toast({
        title: "Error",
        description: "Failed to save version.",
      })
    }
  }, [resume, code, jsonContent, resumeId, toast])

  const saveHtmlToLocalStorage = () => {
    const element = document.getElementById("resume-preview")
    if (!element) return

    const htmlContent = `
      <html>
        <head>
          <style>
            ${document.getElementsByTagName("style")[0].innerHTML}
          </style>
          <title>${resume.name} - Resume</title>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `
    localStorage.setItem("previewHtml", htmlContent)
  }

  const previewHtml = () => {
    saveHtmlToLocalStorage()
    router.push(`/resumes/${resumeId}/preview`)
  }

  const downloadHtml = () => {
    saveHtmlToLocalStorage()
    const htmlDoc = localStorage.getItem("previewHtml")

    if (!htmlDoc) return

    const blob = new Blob([htmlDoc], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    // could be nice to have a 'config' for the scheme of saving the resume name, so users could configure their preferred scheme.
    link.download = `${resume.name}-Resume.html`

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!resume) return <p>Loading...</p>

  return (
    <div className="flex flex-col space-y-6 p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Resume Name"
          name="name"
          value={resume.name}
          onChange={(e) =>
            setResume((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mr-4"
        />
        <div className="flex space-x-4">
          <Button variant="outline" onClick={previewHtml}>
            Preview
          </Button>
          <Button variant="outline" onClick={downloadHtml}>
            Download HTML
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="transition duration-300 ease-in-out"
          >
            {isEditing ? "Hide Editors" : "Show Editors"}
          </Button>
          <Button variant="primary" onClick={handleSaveResumeVersion}>
            Save
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {isEditing && (
          <ResizablePanel
            defaultSize={30}
            className="flex flex-col space-y-2 min-h-[400px] h-full transition-transform duration-300 ease-in-out"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 overflow-hidden"
            >
              <ResizablePanel
                defaultSize={50}
                className="flex flex-col min-h-[400px] h-auto"
              >
                <JsonEditor
                  initialJson={jsonContent}
                  onSave={handleSaveResumeVersion}
                  onChange={(newJson) => {
                    setJsonContent(newJson)
                    onChange(code)
                  }}
                />
              </ResizablePanel>
              <ResizableHandle className="cursor-row-resize" />
              <ResizablePanel
                defaultSize={50}
                className="flex flex-col min-h-[400px] h-auto"
              >
                <CodeEditor
                  initialMarkup={code}
                  onSave={handleSaveResumeVersion}
                  onChange={(newMarkup) => {
                    setMarkup(newMarkup)
                    onChange(newMarkup)
                  }}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        )}
        <ResizableHandle className="cursor-col-resize" />
        <ResizablePanel
          defaultSize={isEditing ? 40 : 100}
          className="bg-white p-4 rounded-lg shadow-md overflow-auto flex justify-center items-center"
        >
          <div id="resume-preview">
            <PreviewOnly element={element} error={error} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ResumeEditPage
