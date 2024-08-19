"use client"

import React, { useState, useEffect, useMemo } from "react"
import JsonEditor from "@/components/json-editor"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { fetchPublicTemplatesWithVersion } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { useLiveRunner } from "react-live-runner"
import { useRouter } from "next/navigation"
import PreviewOnly from "@/components/preview-only"
import { Skeleton } from "@/components/ui/skeleton"

export default function DemoWizard() {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [jsonContent, setJsonContent] = useState({})
  const [selectedTemplateVersion, setSelectedTemplateVersion] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const publicTemplatesWithVersions =
          await fetchPublicTemplatesWithVersion()
        console.warn(
          "demowizard.useEffect.fetchTemplates.publicTemplatesWithVersions",
          JSON.stringify(publicTemplatesWithVersions, null, 2)
        )

        // page.tsx:28 demowizard.useEffect.fetchTemplates.publicTemplatesWithVersions [
        //     {
        //       "id": "03vuwu93hdln8my",
        //       "name": "Default Template",
        //       "templateVersion": {
        //         "collectionId": "w9454ljmq6lutc7",
        //         "collectionName": "template_versions",
        //         "created": "2024-08-14 15:04:18.091Z",
        //         "expand": {
        //           "template_id": {
        //             "collectionId": "1mps6g1vx7nfjnf",
        //             "collectionName": "templates",
        //             "created": "2024-08-08 22:24:27.702Z",
        //             "id": "03vuwu93hdln8my",
        //             "name": "Default Template",
        //             "published": true,
        //             "shared": false,
        //             "updated": "2024-08-08 22:24:27.715Z",
        //             "user_id": "txtv5rheru06c2n"
        //           }
        //         },
        //         "id": "08g6ig3ellg2y3g",
        //         "markup": "<div className=\"m

        setTemplates(publicTemplatesWithVersions)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Error",
          description: `${JSON.stringify(error.message)}`,
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [toast])

  const handleNext = () => setStep((prevStep) => prevStep + 1)
  const handlePrev = () => setStep((prevStep) => prevStep - 1)

  const scope = useMemo(
    () => ({ React, resume_values: jsonContent || {} }),
    [jsonContent]
  )

  const { element, error } = useLiveRunner({
    initialCode: selectedTemplateVersion?.markup || "",
    language: "jsx",
    scope,
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6">
          {step === 1
            ? "Step 1: Add Your Resume Data"
            : step === 2
              ? "Step 2: Choose a Template"
              : "Step 3: Preview Your Resume"}
        </h1>

        {step === 1 && (
          <div className="flex flex-col space-y-6">
            <p className="text-lg text-center text-gray-600 dark:text-gray-400">
              Start by providing your resume data in JSON format. This will be
              used to populate the templates.
            </p>
            <JsonEditor
              initialJson={jsonContent}
              onChange={(newJson) => setJsonContent(newJson)}
            />
            <div className="flex justify-between w-full">
              <Button disabled>Previous</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col space-y-6">
            <p className="text-lg text-center text-gray-600 dark:text-gray-400">
              Choose a template to apply your resume data to.
            </p>
            {loading ? (
              <div className="grid gap-6 lg:grid-cols-2 sm:grid-cols-1">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 sm:grid-cols-1">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer ${
                      selectedTemplateVersion?.id ===
                      template?.latestTemplateVersion?.id
                        ? "border-2 border-primary"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedTemplateVersion(template.latestTemplateVersion)
                    }
                  >
                    <CardHeader>
                      <h2 className="text-xl font-semibold">{template.name}</h2>
                    </CardHeader>
                    {/*<CardContent>*/}
                    {/*  <p className="text-gray-600 dark:text-gray-400">*/}
                    {/*    {template.description}*/}
                    {/*  </p>*/}
                    {/*</CardContent>*/}
                  </Card>
                ))}
              </div>
            )}
            <div className="flex justify-between w-full">
              <Button onClick={handlePrev}>Previous</Button>
              <Button onClick={handleNext} disabled={!selectedTemplateVersion}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col space-y-6">
            <p className="text-lg text-center text-gray-600 dark:text-gray-400">
              Here's a preview of your resume with the selected template:
            </p>
            <div className="p-4 border rounded-lg dark:border-gray-700">
              {error ? (
                <p className="text-red-500">{error.message}</p>
              ) : (
                <PreviewOnly element={element} error={error} />
              )}
            </div>
            <div className="flex justify-between w-full">
              <Button onClick={handlePrev}>Previous</Button>
              <Button onClick={() => router.push("/signup")}>
                Sign Up to Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
