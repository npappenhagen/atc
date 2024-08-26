"use client"

import { useEffect } from "react"
import { verifyOTP } from "@/app/actions"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string; code?: string }
}) {
  const router = useRouter()

  useEffect(() => {
    async function verify() {
      if (searchParams.email && searchParams.code) {
        const formData = new FormData()
        formData.append("email", searchParams.email || "")
        formData.append("code", searchParams.code || "")

        try {
          await verifyOTP(formData)
          router.push("/dashboard")
        } catch (error) {
          console.error("OTP verification failed:", error)
          router.push("/login?error=Failed to verify OTP.")
        }
      }
    }

    verify()
  }, [searchParams, router])

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted-50">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Verifying OTP</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
          <p className="text-gray-600 text-center">
            Please wait while we verify your code...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
