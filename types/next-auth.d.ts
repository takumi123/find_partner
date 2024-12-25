import { DefaultSession } from "next-auth"

// next-auth パッケージに対してマージ宣言
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string | null
    refreshToken?: string | null
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    id?: string
  }
}
