import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ token, session }) {
      session.user = token
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...user }
      }
      return token
    },
  },
}
