import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

  // Build correct base URL for Railway proxy (handles HTTPS termination)
  const host = req.headers.get('host') || nextUrl.host
  const forwardedProto = req.headers.get('x-forwarded-proto')
  const protocol = forwardedProto === 'https' ? 'https' : nextUrl.protocol.replace(':', '')
  const baseUrl = `${protocol}://${host}`

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL('/login', baseUrl))
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL('/', baseUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
