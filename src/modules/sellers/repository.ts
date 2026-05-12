import { db } from "@/lib/db";

export async function findAllSellers() {
  return db.user.findMany({
    where: {
      role: { slug: "seller" },
    },
    include: {
      userBranches: {
        include: {
          branch: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function findSellerById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      role: { select: { slug: true } },
      userBranches: {
        include: {
          branch: true,
        },
      },
      _count: {
        select: { sales: true },
      },
    },
  });
}
