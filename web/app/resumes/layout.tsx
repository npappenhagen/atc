import "@/styles/globals.css"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { MainNav } from "@/components/main-nav"
import { UserAccountNav } from "@/components/user-account-nav"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser()

  if (!user) {
    console.error("lost user", JSON.stringify(user))
    return notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex items-center justify-between py-4">
          <MainNav />
          <UserAccountNav
            user={{
              name: user.name,
              image: user.image,
              email: user.email,
            }}
          />
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col overflow-hidden p-6">
        {children}
      </main>
    </div>
  )
}
