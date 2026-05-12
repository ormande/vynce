import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type Role } from "@prisma/client";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roleSlug?: string;
      permissions: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleSlug?: string;
    permissions?: string[];
  }
}

async function getDefaultRole(): Promise<Role | null> {
  return db.role.findFirst({
    where: { slug: "employee" },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const currentUser = await db.user.findUnique({
        where: { email: user.email },
      });

      if (currentUser) {
        await db.user.update({
          where: { id: currentUser.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (!email) return token;

      const dbUser = await db.user.findUnique({
        where: { email },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
          userPermissions: {
            include: { permission: true },
          },
        },
      });

      if (!dbUser) {
        return token;
      }

      const rolePermissions =
        dbUser.role?.permissions.map((item) => item.permission.key) ?? [];
      const userOverrides = dbUser.userPermissions
        .filter((item) => item.allowed)
        .map((item) => item.permission.key);

      token.sub = dbUser.id;
      token.roleSlug = dbUser.role?.slug;
      token.permissions = [...new Set([...rolePermissions, ...userOverrides])];
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roleSlug = token.roleSlug;
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const usersCount = await db.user.count();
      const role = await db.role.findFirst({
        where: { slug: usersCount <= 1 ? "owner" : "employee" },
      });
      const fallbackRole = role ?? (await getDefaultRole());

      await db.user.update({
        where: { id: user.id },
        data: {
          roleId: fallbackRole?.id,
          lastLoginAt: new Date(),
        },
      });
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
