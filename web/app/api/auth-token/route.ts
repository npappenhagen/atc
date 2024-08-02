// app/api/auth-token/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * API route to fetch the authentication token from cookies
 * Because the Cookie is HTTP only and is only accessed server-side in NextJS
 */
export async function GET(request: NextRequest) {
  try {
    const authCookie = cookies().get("pb_auth")
    if (!authCookie) {
      throw new Error("Authentication cookie not found")
    }

    const { token, model } = JSON.parse(authCookie.value)

    if (!token) {
      throw new Error("Token not found in authentication cookie")
    }

    return NextResponse.json({ token, model })
  } catch (error) {
    console.error("Failed to get auth token:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
