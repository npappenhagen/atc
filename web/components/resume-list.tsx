"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableRow, TableCell, TableHeader } from "@/components/ui/table"
import { deleteResume } from "@/app/actions"
import ResumeEditor from "@/components/resume-editor"

export default function ResumeList({ resumes }) {
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  const handleDelete = async (resumeId) => {
    await deleteResume(resumeId)
    // Trigger a refresh or update the state to reflect changes
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {selectedResumeId && <ResumeEditor resumeId={selectedResumeId} />}
    </div>
  )
}
