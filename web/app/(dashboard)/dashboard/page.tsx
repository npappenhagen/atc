import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { EmptyPlaceholder } from "@/components/empty-placeholder"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return notFound()
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Posts" text="Create and manage posts.">
        <div>hi</div>
      </DashboardHeader>
      <div>
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="post" />
          <EmptyPlaceholder.Title>No posts created</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You don&apos;t have any posts yet. Start creating content.
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      </div>
    </DashboardShell>
  )
}
