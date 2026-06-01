import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";

const emailFrom =
  process.env.EMAIL_FROM ?? "Juha Observation OS <noreply@example.com>";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY ?? "dev-placeholder",
      from: emailFrom,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  trustHost: true,
});
