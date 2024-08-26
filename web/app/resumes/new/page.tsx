import { getCurrentUser } from "@/lib/session"
import { createNewResume } from "@/app/actions"
import { redirect } from "next/navigation"

export default async function NewResumePage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
    return null
  }

  // Create a new resume with either a public template or a blank one
  const newResumeId = await createNewResume(user.id)

  // Redirect to the resume editor page after creation
  redirect(`/resumes/${newResumeId}/edit`)
  return null
}
