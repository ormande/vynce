-- Renomeia o papel operacional de employee para seller (Vendedor).
UPDATE "Role" SET slug = 'seller', name = 'Vendedor' WHERE slug = 'employee';
