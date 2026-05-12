export const permissionCatalog = {
  dashboardView: "dashboard:view",
  customersRead: "customers:read",
  customersWrite: "customers:write",
  productsRead: "products:read",
  productsWrite: "products:write",
  inventoryRead: "inventory:read",
  inventoryWrite: "inventory:write",
  salesRead: "sales:read",
  salesWrite: "sales:write",
  receivablesRead: "receivables:read",
  receivablesWrite: "receivables:write",
  reportsRead: "reports:read",
  usersManage: "users:manage",
  settingsManage: "settings:manage",
  branchesRead: "branches:read",
  branchesWrite: "branches:write",
  branchesTransfer: "branches:transfer",
  transfersRead: "transfers:read",
  transfersWrite: "transfers:write",
  transfersConfirm: "transfers:confirm",
} as const;

export type PermissionKey =
  (typeof permissionCatalog)[keyof typeof permissionCatalog];

export function hasPermission(
  permissions: string[] | undefined,
  permission: PermissionKey,
) {
  return permissions?.includes(permission) ?? false;
}
