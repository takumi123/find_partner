// app/auth.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./_lib/prisma"
const handler = NextAuth({
  callbacks: {
    async signIn({ user, account }) {
      try {
        // ユーザーが存在しない場合は作成
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        let dbUser = existingUser;
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
            }
          });
          console.log('Created new user:', dbUser);
        }

        if (account) {
          // アカウント情報を保存
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          });

          // アカウント情報を更新または作成
          const accountData = {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token ?? undefined,
            refresh_token: account.refresh_token ?? undefined,
            expires_at: account.expires_at ?? undefined,
            token_type: account.token_type ?? undefined,
            scope: account.scope ?? undefined,
            id_token: account.id_token ?? undefined,
          };

          if (existingAccount) {
            // 既存アカウントの場合は更新
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              data: accountData,
            });
          } else {
            // 新規アカウントの場合は作成
            await prisma.account.create({
              data: accountData,
            });
          }

          // リフレッシュトークンが取得できていない場合はエラー
          if (!account.refresh_token) {
            console.error('リフレッシュトークンが取得できませんでした');
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async redirect({ baseUrl }) {
      // サインイン・サインアウト後のリダイレクト先を設定
      return baseUrl
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      if (user?.email) {
        // データベースからユーザーIDを取得
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token
    },
    async session({ session, token }) {
      // 万一 token がないケースを考慮
      session.accessToken = token?.accessToken as string | undefined
      session.refreshToken = token?.refreshToken as string | undefined
      
      // トークンからユーザーIDを取得
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      
      return session
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          include_granted_scopes: true,
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/youtube.upload"
          ].join(" "),
        },
      },
    }),
  ],
})

export const { auth, signIn, signOut } = handler
export const { GET, POST } = handler.handlers
