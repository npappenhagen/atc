"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

import { createResume } from "@/app/actions"

export default function CreateResumeForm({ userId, templates }) {
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [templateId, setTemplateId] = useState("")

  const handleContentChange = (e) => {
    try {
      const formatted = JSON.stringify(JSON.parse(e.target.value), null, 2)
      setContent(formatted)
    } catch (error) {
      setContent(e.target.value) // If JSON is invalid, keep raw input
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("userId", userId)
    formData.append("name", name)
    formData.append("content", content)
    formData.append("templateId", templateId)

    await createResume(formData)

    setName("")
    setContent("")
    setTemplateId("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        placeholder="Resume Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        placeholder="Resume Content (JSON)"
        name="content"
        value={content}
        onChange={handleContentChange}
      />
      <Select
        id="template-select"
        name="templateId"
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        placeholder="Select Template"
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </Select>
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit">Create Resume</Button>
    </form>
  )
}
