import { cache } from "react";

import { db } from "@/lib/db";
import { WALK_IN_SALE_CUSTOMER_PHONE } from "@/modules/customers/repository";

export type SetupSnapshot = {
  branchCount: number;
  categoryCount: number;
  productCount: number;
  saleCount: number;
  sellerCount: number;
  customerCount: number;
  hasBranches: boolean;
  hasCategories: boolean;
  hasProducts: boolean;
  hasSales: boolean;
  hasSellers: boolean;
  hasCustomers: boolean;
};

export const getSetupSnapshot = cache(async (): Promise<SetupSnapshot> => {
  const [
    branchCount,
    categoryCount,
    productCount,
    saleCount,
    sellerCount,
    customerCount,
  ] = await Promise.all([
    db.branch.count({ where: { isActive: true } }),
    db.category.count({ where: { isActive: true } }),
    db.product.count(),
    db.sale.count(),
    db.user.count({ where: { role: { slug: "seller" } } }),
    db.customer.count({
      where: { phone: { not: WALK_IN_SALE_CUSTOMER_PHONE } },
    }),
  ]);

  return {
    branchCount,
    categoryCount,
    productCount,
    saleCount,
    sellerCount,
    customerCount,
    hasBranches: branchCount > 0,
    hasCategories: categoryCount > 0,
    hasProducts: productCount > 0,
    hasSales: saleCount > 0,
    hasSellers: sellerCount > 0,
    hasCustomers: customerCount > 0,
  };
});
