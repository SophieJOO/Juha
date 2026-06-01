import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ??
        process.env.GOOGLE_CLIENT_ID ??
        "dev-placeholder",
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ??
        process.env.GOOGLE_CLIENT_SECRET ??
        "dev-placeholder",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(user.email);
    },
  },
  trustHost: true,
});
