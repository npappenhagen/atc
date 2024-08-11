"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableRow, TableCell, TableHeader } from "@/components/ui/table"
import { deleteResume, createOrUpdateResume } from "@/app/actions"

export default function ResumeList({ resumes, userId }) {
  const router = useRouter()

  const handleEdit = (resumeId: string) => {
    // Navigate to the resume edit page using the resumeId
    router.push(`/resumes/${resumeId}/edit`)
  }

  const handleDelete = async (resumeId: string) => {
    await deleteResume(resumeId)
    // Additional logic for deletion
  }

  const handleDuplicate = async (resume: any) => {
    // Logic for duplicating a resume
  }

  return (
    <div className="flex flex-col gap-6">
      <Button onClick={() => router.push("/resumes/new")}>
        Create New Resume
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Resume Name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {resumes.map((resume: any) => (
            <TableRow key={resume.id}>
              <TableCell>{resume.name}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => handleEdit(resume.id)}>
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
    </div>
  )
}
