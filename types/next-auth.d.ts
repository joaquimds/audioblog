import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    emailHash?: string,
    isAdmin?: boolean
  }
}
