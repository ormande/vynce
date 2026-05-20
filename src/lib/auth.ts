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
      branchIds: string[];
      accessAll: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleSlug?: string;
    status?: string;
    permissions?: string[];
    branchIds?: string[];
    accessAll?: boolean;
    refreshedAt?: number;
  }
}

/**
 * Por padrão recarregamos permissões do banco a cada 30 segundos.
 * Isso garante refresh quase imediato após mudanças de permissão/role
 * sem disparar uma query pesada em toda navegação.
 */
const JWT_REFRESH_INTERVAL_MS = 30_000;

async function getDefaultRole(): Promise<Role | null> {
  return db.role.findFirst({
    where: { slug: "seller" },
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
        if (currentUser.status === "DISABLED") {
          return "/signin?error=AccountDisabled";
        }
        await db.user.update({
          where: { id: currentUser.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      const email = user?.email ?? token.email;
      if (!email) return token;

      // Só recarrega do banco no login, em update explícito, ou após o intervalo.
      const now = Date.now();
      const refreshedAt = token.refreshedAt ?? 0;
      const isFreshLogin = Boolean(user);
      const isExpired = now - refreshedAt > JWT_REFRESH_INTERVAL_MS;
      const shouldRefresh = isFreshLogin || trigger === "update" || isExpired;

      if (!shouldRefresh && token.sub) {
        return token;
      }

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
          userBranches: {
            select: { branchId: true, accessAll: true },
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
      token.status = dbUser.status;
      token.permissions = [...new Set([...rolePermissions, ...userOverrides])];
      token.branchIds = dbUser.userBranches.map((ub) => ub.branchId);
      token.accessAll = dbUser.userBranches.some((ub) => ub.accessAll);
      token.refreshedAt = now;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roleSlug = token.roleSlug;
        session.user.permissions = token.permissions ?? [];
      }
      if (session.user) {
        session.user.branchIds = (token.branchIds as string[] | undefined) ?? [];
        session.user.accessAll = Boolean(token.accessAll);
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const usersCount = await db.user.count();
      const role = await db.role.findFirst({
        where: { slug: usersCount <= 1 ? "owner" : "seller" },
      });
      const fallbackRole = role ?? (await getDefaultRole());

      await db.user.update({
        where: { id: user.id },
        data: {
          roleId: fallbackRole?.id,
          lastLoginAt: new Date(),
        },
      });

      if (fallbackRole?.slug === "owner") {
        const branches = await db.branch.findMany({ select: { id: true } });
        await Promise.all(
          branches.map((branch) =>
            db.userBranch.upsert({
              where: {
                userId_branchId: { userId: user.id, branchId: branch.id },
              },
              create: {
                userId: user.id,
                branchId: branch.id,
                accessAll: true,
              },
              update: { accessAll: true },
            }),
          ),
        );
      }
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
