"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import JsonEditor from "@/components/json-editor"
import CodeEditor from "@/components/code-editor"
import PreviewOnly from "@/components/preview-only"
import { saveResumeContent, fetchResumeData } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { redirect, useRouter } from "next/navigation"
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable"
import { useLiveRunner } from "react-live-runner"

const tailwindCSS = `
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
`

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

    // Store the HTML content in localStorage
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

    // Create a link element
    const link = document.createElement("a")
    link.href = url
    // could be nice to have a 'config' for the scheme of saving the resume name, so users could configure their preferred scheme.
    link.download = `${resume.name}-Resume.html` // Customize the filename as needed

    // Append the link to the document and trigger a click
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
                  onSave={handleSaveJson}
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
                  onSave={handleSaveMarkup}
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
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <div id="resume-preview">
            <PreviewOnly element={element} error={error} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ResumeEditPage
