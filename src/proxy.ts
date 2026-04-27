import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

  // Fix protocol for Railway proxy (x-forwarded-proto: https)
  const proto = req.headers.get('x-forwarded-proto')
  if (proto === 'https' && nextUrl.protocol === 'http:') {
    nextUrl.protocol = 'https:'
    nextUrl.port = ''
  }

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
