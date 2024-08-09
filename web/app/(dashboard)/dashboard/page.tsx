import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import ResumeList from "@/components/resume-list"
import CreateResumeForm from "@/components/create-resume-form"
import { fetchTemplates, fetchResumes } from "@/app/actions"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return notFound()
  }

  const templates = await fetchTemplates()
  const resumes = await fetchResumes(user.id)

  return (
    <DashboardShell>
      <DashboardHeader heading="Resumes" text="Create and manage resumes." />
      <div className="grid gap-10">
        <div>
          <CreateResumeForm userId={user.id} templates={templates} />
          <ResumeList resumes={resumes} userId={user.id} />
        </div>
      </div>
    </DashboardShell>
  )
}
