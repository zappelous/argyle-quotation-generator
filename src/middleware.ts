import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL('/', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
