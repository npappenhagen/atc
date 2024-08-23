"use client"

import { useState } from "react"
import { sendOTP, verifyOTP } from "@/app/actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function UserOTPAuthForm() {
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const handleSendOTP = async (formData: FormData) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await sendOTP(formData)
      setOtpSent(true)
      setEmail(formData.get("email") as string)
    } catch (error) {
      console.error("Error sending OTP:", error)
      setErrorMessage("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (formData: FormData) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await verifyOTP(formData)
    } catch (error) {
      console.error("Error verifying OTP:", error)
      setErrorMessage("Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}

      {!otpSent ? (
        <form action={handleSendOTP} className="grid gap-2">
          <Input
            name="email"
            placeholder="Enter your email"
            type="email"
            autoComplete="email"
            disabled={loading}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>
      ) : (
        <form action={handleVerifyOTP} className="grid gap-2">
          <input type="hidden" name="email" value={email || ""} />
          <Input
            name="otp"
            placeholder="Enter OTP"
            type="text"
            autoComplete="one-time-code"
            disabled={loading}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Verify OTP"
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
