import { NextRequest, NextResponse } from "next/server"
import { isTokenExpired } from "pocketbase"
import { db } from "@/lib/db"

/**
 * Middleware to check for authentication on protected routes.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify")
  ) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get("pb_auth")

  if (!authCookie) {
    console.error("Auth cookie missing in middleware.")
    db.authStore.clear()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  let parsedAuthCookie
  try {
    parsedAuthCookie = JSON.parse(authCookie.value || "{}")
  } catch (error) {
    console.error("Invalid auth cookie:", error)
    db.authStore.clear()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { token, model } = parsedAuthCookie

  if (!token || isTokenExpired(token)) {
    db.authStore.clear()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  db.authStore.save(token, model)

  try {
    await db.collection("users").authRefresh()
  } catch (error) {
    db.authStore.clear()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}
