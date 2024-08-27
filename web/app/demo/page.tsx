"use client"

import React, { useState, useEffect, useMemo } from "react"
import JsonEditor from "@/components/json-editor"
import CodeEditor from "@/components/code-editor"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { fetchPublicTemplatesWithVersion } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { useLiveRunner } from "react-live-runner"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import PreviewOnly from "@/components/preview-only"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, Moon } from "lucide-react"

export default function DemoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [jsonContent, setJsonContent] = useState({})
  const [selectedTemplateVersion, setSelectedTemplateVersion] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState("")
  const [isEditing, setIsEditing] = useState(true)

  // Fetch public templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const publicTemplatesWithVersions =
          await fetchPublicTemplatesWithVersion()
        setTemplates(publicTemplatesWithVersions)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Error",
          description: `${error.message}`,
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [toast])

  // Update code whenever the selected template changes
  useEffect(() => {
    if (selectedTemplateVersion?.markup) {
      setCode(selectedTemplateVersion.markup)
    }
  }, [selectedTemplateVersion])

  const scope = useMemo(
    () => ({
      React,
      resume_values: jsonContent || {},
    }),
    [jsonContent]
  )

  const { element, error } = useLiveRunner({
    code, // Using dynamic `code` for live preview
    language: "jsx",
    scope,
  })

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
          value={selectedTemplateVersion?.name || ""}
          onChange={(e) =>
            setSelectedTemplateVersion((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="mr-4"
        />
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => downloadHtml()}>
            Download HTML
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Hide Editors" : "Show Editors"}
          </Button>
          <Button
            variant="outline"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            {document.documentElement.classList.contains("dark") ? (
              <Sun />
            ) : (
              <Moon />
            )}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {isEditing && (
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            className="border-r dark:border-gray-700"
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Resume Data Editor</h2>
              <JsonEditor
                initialJson={jsonContent}
                onChange={(newJson) => setJsonContent(newJson)}
              />
            </div>
          </ResizablePanel>
        )}

        <ResizableHandle className="cursor-col-resize" />

        <ResizablePanel defaultSize={isEditing ? 30 : 60} minSize={30}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Template Editor</h2>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="grid gap-6 lg:grid-cols-2 sm:grid-cols-1">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 lg:grid-cols-2 sm:grid-cols-1">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer ${
                          selectedTemplateVersion?.id ===
                          template?.templateVersion?.id
                            ? "border-2 border-primary"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedTemplateVersion(template?.templateVersion)
                        }
                      >
                        <CardHeader>
                          <h2 className="text-xl font-semibold">
                            {template.name}
                          </h2>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>

                  {selectedTemplateVersion && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">
                        Edit Template Markup
                      </h3>
                      <CodeEditor
                        initialMarkup={code}
                        onSave={() => {
                          toast({
                            title: "Template Saved",
                            description: "The template has been updated.",
                          })
                        }}
                        onChange={(newMarkup) => setCode(newMarkup)}
                        className="h-[400px]"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="cursor-col-resize" />

        <ResizablePanel
          defaultSize={isEditing ? 40 : 100}
          className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md overflow-auto flex flex-col justify-start items-center min-w-[300px]"
        >
          <div className="w-full p-2 text-center text-sm font-medium bg-gray-100 dark:bg-gray-800 border-b">
            Resume Preview
          </div>
          <div id="resume-preview" className="flex-1 w-full p-4">
            {error ? (
              <p className="text-red-500">{error.message}</p>
            ) : (
              <PreviewOnly element={element} error={error} />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
