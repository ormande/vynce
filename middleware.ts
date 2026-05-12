export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/products/:path*",
    "/inventory/:path*",
    "/sales/:path*",
    "/receivables/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/api/customers/:path*",
    "/api/products/:path*",
    "/api/sales/:path*",
    "/api/payments/:path*",
    "/api/dashboard/:path*",
    "/api/reports/:path*",
  ],
};
