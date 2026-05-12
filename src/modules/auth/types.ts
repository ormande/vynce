export type AuthenticatedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  roleSlug?: string;
  permissions: string[];
};
