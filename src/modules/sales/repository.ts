import { db } from "@/lib/db";

export async function listSales(search?: string) {
  return db.sale.findMany({
    where: search
      ? {
          customer: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }
      : undefined,
    include: {
      customer: true,
      seller: true,
      items: {
        include: {
          product: true,
        },
      },
      receivable: true,
      payments: true,
    },
    orderBy: { soldAt: "desc" },
  });
}
