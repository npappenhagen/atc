import { useEffect, useState } from "react"
import { db, initializeDb } from "@/lib/db"

/**
 * Custom hook to initialize and synchronize PocketBase on the client side.
 * this should probably not exist... just keep pocketbase on the server.
 */
const useClientsidePocketbase = () => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      await initializeDb()
      setIsInitialized(true)
    }
    initialize()
  }, [])

  return { db, isInitialized }
}

export default useClientsidePocketbase
