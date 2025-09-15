import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      roles?: Array<{
        scope: string
        regionId?: number | null
        universityId?: number | null
        smallGroupId?: number | null
        alumniGroupId?: number | null
        region?: { name: string } | null
        university?: { name: string } | null
        smallgroup?: { name: string } | null
        alumnismallgroup?: { name: string } | null
      }>
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
    roles?: Array<{
      scope: string
      regionId?: number | null
      universityId?: number | null
      smallGroupId?: number | null
      alumniGroupId?: number | null
      region?: { name: string } | null
      university?: { name: string } | null
      smallgroup?: { name: string } | null
      alumnismallgroup?: { name: string } | null
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: Array<{
      scope: string
      regionId?: number | null
      universityId?: number | null
      smallGroupId?: number | null
      alumniGroupId?: number | null
      region?: { name: string } | null
      university?: { name: string } | null
      smallgroup?: { name: string } | null
      alumnismallgroup?: { name: string } | null
    }>
    username?: string
  }
}


