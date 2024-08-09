"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableRow, TableCell, TableHeader } from "@/components/ui/table"
import { deleteResume, createOrUpdateResume } from "@/app/actions"
import ResumeEditor from "@/components/resume-editor"

export default function ResumeList({ resumes, userId }) {
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleDelete = async (resumeId) => {
    await deleteResume(resumeId)
    setSelectedResumeId(null) // Close editor if the deleted resume was open
  }

  const handleDuplicate = async (resume) => {
    try {
      const newResume = await createOrUpdateResume({
        user_id: resume.user_id,
        name: "", // Optionally pass a new name or leave it as a copy
        content: "", // Optionally override content or leave it empty to clone the existing content
        resume_id_to_clone: resume.id,
      })
      setSelectedResumeId(newResume.id) // Open the newly duplicated resume in the editor
    } catch (error) {
      console.error("Failed to duplicate resume:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button onClick={() => setIsCreating(true)}>Create New Resume</Button>
      {isCreating && (
        <ResumeEditor
          resumeId={null} // null indicates a new resume creation
          onClose={() => setIsCreating(false)} // Close the editor on cancel or save
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Resume Name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {resumes.map((resume) => (
            <TableRow key={resume.id}>
              <TableCell>{resume.name}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => setSelectedResumeId(resume.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(resume.id)}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDuplicate(resume)}
                >
                  Duplicate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {selectedResumeId && (
        <ResumeEditor
          resumeId={selectedResumeId}
          onClose={() => setSelectedResumeId(null)}
        />
      )}
    </div>
  )
}
