import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to root page (login page) without authentication
        if (req.nextUrl.pathname === '/') {
          return true
        }
        
        // Allow access to API auth routes
        if (req.nextUrl.pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Explicitly protect dashboard and all sub-routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        // Explicitly protect all links routes
        if (req.nextUrl.pathname.startsWith('/links')) {
          return !!token
        }
        
        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


