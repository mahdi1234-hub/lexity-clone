import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

// Only use Prisma adapter if DATABASE_URL is configured
const adapter = process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined;

export const authOptions: NextAuthOptions = {
  ...(adapter ? { adapter } : {}),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/tasks.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token?.sub;
      }
      (session as { accessToken?: string }).accessToken = token?.accessToken as string;
      return session;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to /chat after sign-in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/chat`;
    },
  },
  events: {
    async signIn({ user }) {
      // Track login activity (non-blocking, won't break auth if DB is down)
      if (user.id && process.env.DATABASE_URL) {
        try {
          const { trackActivity } = await import("@/lib/activity");
          await trackActivity(user.id, "login");
        } catch {
          // Silently fail - don't break auth flow
        }
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
