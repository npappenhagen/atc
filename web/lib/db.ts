import PocketBase from "pocketbase"

const db = new PocketBase("http://localhost:8080")

/**
 * Utility function to get the token from cookies
 * and initialize the PocketBase client on the client side.
 */
export async function initializeDb() {
  try {
    const res = await fetch("/api/auth-token", {
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Failed to fetch auth token")
    }

    const { token, model } = await res.json()
    if (token) {
      db.authStore.save(token, model)
    }
  } catch (error) {
    console.error("Failed to initialize PocketBase:", error)
  }
}

export { db }
