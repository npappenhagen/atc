import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import ResumeList from "@/components/resume-list"
import { fetchTemplates, fetchResumes } from "@/app/actions"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    console.error("lost user", JSON.stringify(user))
    return notFound()
  }

  const templates = await fetchTemplates()
  const resumes = await fetchResumes(user.id)

  if (resumes.length == 0) {
    console.error("lost resumes", JSON.stringify(resumes))
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Resumes" text="Create and manage resumes." />
      <div className="grid gap-10">
        <div>
          <ResumeList resumes={resumes} userId={user.id} />
        </div>
      </div>
    </DashboardShell>
  )
}
