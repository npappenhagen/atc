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
import { Icons } from "@/components/icons"
import { useLiveRunner } from "react-live-runner"

const ResumeEditPage = ({ params }: { params: { resumeId: string } }) => {
  const { resumeId } = params
  const [resume, setResume] = useState(null)
  const [markup, setMarkup] = useState("")
  const [jsonContent, setJsonContent] = useState({})
  const [isEditing, setIsEditing] = useState(true)
  const [activeTab, setActiveTab] = useState<"content" | "template">("content")
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

  const handleSaveResumeVersion = useCallback(async () => {
    try {
      await saveResumeVersion(
        resumeId,
        resume.name,
        JSON.stringify(jsonContent, null, 2),
        code
      )
      toast({
        title: "Success",
        description: "Version saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
      })
    }
  }, [resume, code, jsonContent, resumeId, toast])

  if (!resume) return <p>Loading...</p>

  const saveHtmlToLocalStorage = () => {
    const element = document.getElementById("resume-preview")
    if (!element) return

    const htmlContent = `
      <html>
        <head>
          <style>
            ${document.getElementsByTagName("style")[0].innerHTML}
          </style>
          <title>Resume Preview</title>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `
    localStorage.setItem("previewHtml", htmlContent)
  }
  const downloadHtml = () => {
    saveHtmlToLocalStorage()
    const htmlDoc = localStorage.getItem("previewHtml")

    if (!htmlDoc) return

    const blob = new Blob([htmlDoc], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `Resume-Preview.html`
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col space-y-6 p-6 h-full bg-gray-50 dark:bg-gray-900">
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
          <Button
            variant="outline"
            onClick={() => router.push(`/resumes/${resumeId}/preview`)}
          >
            Preview
          </Button>
          <Button variant="outline" onClick={() => downloadHtml()}>
            Download HTML
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Hide Editors" : "Show Editors"}
          </Button>
          <Button variant="primary" onClick={handleSaveResumeVersion}>
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            {document.documentElement.classList.contains("dark") ? (
              <Icons.sun />
            ) : (
              <Icons.moon />
            )}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={isEditing ? 50 : 0}
          minSize={0}
          className={`transition-all duration-300 ease-in-out border-r dark:border-gray-700 ${
            isEditing ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-2 border-b dark:border-gray-700">
              <button
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium ${
                  activeTab === "content"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                } border-t border-l border-r dark:border-gray-700 rounded-t-md`}
                onClick={() => setActiveTab("content")}
              >
                <Icons.code className="h-4 w-4" />
                <span>Content</span>
              </button>

              <button
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium ${
                  activeTab === "template"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                } border-t border-l border-r dark:border-gray-700 rounded-t-md`}
                onClick={() => setActiveTab("template")}
              >
                <Icons.fileText className="h-4 w-4" />
                <span>Template</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === "content" && (
                <JsonEditor
                  initialJson={jsonContent}
                  onSave={handleSaveResumeVersion}
                  onChange={(newJson) => setJsonContent(newJson)}
                  className="h-full"
                />
              )}

              {activeTab === "template" && (
                <CodeEditor
                  initialMarkup={code}
                  onSave={handleSaveResumeVersion}
                  onChange={(newMarkup) => setMarkup(newMarkup)}
                  className="h-full"
                />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="cursor-col-resize" />

        <ResizablePanel
          defaultSize={50}
          className="bg-white dark:bg-gray-850 p-4 rounded-lg shadow-md flex flex-col"
        >
          <div className="flex-1 overflow-auto">
            <PreviewOnly element={element} error={error} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ResumeEditPage
