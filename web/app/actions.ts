// app/actions.ts
"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

/**
 * Logs in the user by authenticating with PocketBase and
 * setting the authentication token in cookies.
 */
export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { token, record: model } = await db
    .collection("users")
    .authWithPassword(email, password)
  const cookie = JSON.stringify({ token, model })

  cookies().set("pb_auth", cookie, {
    secure: true,
    path: "/",
    sameSite: "strict",
    httpOnly: true,
  })

  db.authStore.save(token)

  redirect("/dashboard")
}

/**
 * Registers a new user in PocketBase, sets the authentication token in cookies,
 * and redirects to the dashboard.
 */
export async function register(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  const data = {
    username,
    email,
    emailVisibility: true,
    password,
    passwordConfirm: password,
    name: email,
  }

  try {
    await db.collection("users").create(data)

    const { token, record: model } = await db
      .collection("users")
      .authWithPassword(email, password)
    const cookie = JSON.stringify({ token, model })

    cookies().set("pb_auth", cookie, {
      secure: true,
      path: "/",
      sameSite: "strict",
      httpOnly: true,
    })

    db.authStore.save(token)

    redirect("/dashboard")
  } catch (error) {
    console.error("Error registering user:", error)
  }
}

/**
 * Logs out the user by clearing the authentication token from cookies and PocketBase,
 * and redirects to the login page.
 */
export async function logout() {
  cookies().delete("pb_auth")
  db.authStore.clear()
  redirect("/login")
}
