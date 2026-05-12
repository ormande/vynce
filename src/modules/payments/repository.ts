import { db } from "@/lib/db";

export async function listReceivables(search?: string) {
  return db.receivable.findMany({
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
      sale: true,
      payments: true,
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}
