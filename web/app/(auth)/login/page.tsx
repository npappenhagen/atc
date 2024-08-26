import { redirectToVerifyPage, sendOTP, verifyOTP } from "@/app/actions"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; email?: string }
}) {
  const email = searchParams.email || ""

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted-50">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Log in</CardTitle>
        </CardHeader>
        <CardContent>
          {searchParams.error && (
            <p className="text-red-500 text-center">{searchParams.error}</p>
          )}

          {!email ? (
            <form action={sendOTP} className="space-y-4">
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full"
                required
              />
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
            </form>
          ) : (
            <form action={redirectToVerifyPage} className="space-y-4">
              <Input
                type="email"
                name="email"
                defaultValue={email}
                readOnly
                className="w-full"
              />
              <Input
                type="number"
                name="code"
                placeholder="Enter OTP code"
                className="w-full"
                required
              />
              <Button type="submit" className="w-full">
                Verify OTP
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
