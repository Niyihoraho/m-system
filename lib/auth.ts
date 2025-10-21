import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              userrole: {
                include: {
                  region: true,
                  university: true,
                  smallgroup: true,
                  alumnismallgroup: true,
                }
              }
            }
          })

          if (!user) {
            return null
          }

          // Check if user has a password (some users might be OAuth only)
          if (!user.password) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)

          if (!isValidPassword) {
            return null
          }

          // User is valid (no status field in schema)

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.image,
            roles: user.userrole?.map(role => ({
              scope: role.scope,
              regionId: role.regionId,
              universityId: role.universityId,
              smallGroupId: role.smallGroupId,
              alumniGroupId: role.alumniGroupId,
              region: role.region,
              university: role.university,
              smallgroup: role.smallgroup,
              alumnismallgroup: role.alumnismallgroup,
            })) || []
          }
        } catch (error) {
          console.error("Auth error:", error)
          // Don't expose database errors to client
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = user.roles
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.roles = token.roles as Array<{
          scope: string;
          regionId?: number;
          universityId?: number;
          smallGroupId?: number;
          alumniGroupId?: number;
          region?: { name: string };
          university?: { name: string };
          smallgroup?: { name: string };
          alumnismallgroup?: { name: string };
        }>
      }
      return session
    }
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  trustHost: process.env.NODE_ENV === "production" ? false : true,
})
