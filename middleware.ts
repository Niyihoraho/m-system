import { auth } from "@/lib/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Allow access to root page (login page) without authentication
  if (nextUrl.pathname === '/') {
    return
  }
  
  // Allow access to API auth routes
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return
  }
  
  // Explicitly protect dashboard and all sub-routes
  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/', nextUrl))
    }
    return
  }
  
  // Explicitly protect all links routes
  if (nextUrl.pathname.startsWith('/links')) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/', nextUrl))
    }
    return
  }
  
  // Require authentication for all other routes
  if (!isLoggedIn) {
    return Response.redirect(new URL('/', nextUrl))
  }
})

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


