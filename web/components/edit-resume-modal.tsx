"use client"

import React, { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateResume } from "@/app/actions"
import Playground from "@/components/live-runner/playground"
import { useToast } from "@/components/ui/use-toast"

export function EditResumeModal({ resume, userId, onClose }) {
  const [name, setName] = useState(resume.name)
  const [content, setContent] = useState(
    JSON.stringify(resume.content, null, 2)
  )
  const [markup, setMarkup] = useState(resume.markup || "")
  const { toast } = useToast()

  const handleSave = async () => {
    try {
      await updateResume(resume.id, name, content, markup)
      toast({
        title: "success",
        description: "Resume saved successfully.",
      })
      onClose()
    } catch (error) {
      toast({
        title: "fail",
        description: "Failed to save resume.",
      })
    }
  }

  return (
    <Dialog onClose={onClose} title="Edit Resume" className="max-w-4xl">
      <div className="flex flex-col gap-4">
        <Input
          label="Resume Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Resume Content (JSON)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Playground
          userId={userId}
          markup={markup}
          onMarkupChange={(newMarkup) => setMarkup(newMarkup)}
        />
        <Button onClick={handleSave}>Save</Button>
      </div>
    </Dialog>
  )
}
