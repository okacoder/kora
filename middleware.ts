import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicRoutes = ["/", "/login", "/signup", "/register", "/forgot-password"];
const authRoutes = ["/login", "/signup", "/register", "/forgot-password"];
const protectedRoutes = [
  "/dashboard",
  "/games", 
  "/account", 
  "/koras", 
  "/settings",
  "/setting",
  "/transactions",
  "/admin"
];

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
