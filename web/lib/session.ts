import { cookies } from "next/headers"

export async function getCurrentUser() {
  const cookie = cookies().get("pb_auth")
  if (!cookie) {
    console.error("getCurrentUser, no cookie found")
    return null
  }

  const authData = JSON.parse(cookie.value)
  return authData.model
}
