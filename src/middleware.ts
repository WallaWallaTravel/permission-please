import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/teacher', '/parent', '/admin'];

// Routes that should redirect authenticated users
const authRoutes = ['/login', '/signup'];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  TEACHER: ['/teacher'],
  ADMIN: ['/teacher', '/parent'], // Admins can access both
  PARENT: ['/parent'],
  SUPER_ADMIN: ['/teacher', '/parent', '/admin'], // Super admins can access everything
};

/**
 * Extract subdomain from hostname
 */
function getSubdomain(host: string): string | null {
  // Handle localhost
  if (host.includes('localhost')) {
    return null;
  }

  // Remove port if present
  const hostname = host.split(':')[0];

  // Check for permissionplease.app domain
  const baseDomain = 'permissionplease.app';
  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    return null;
  }

  // Extract subdomain
  if (hostname.endsWith(`.${baseDomain}`)) {
    const subdomain = hostname.replace(`.${baseDomain}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  // Handle Vercel preview URLs - no subdomain handling
  if (hostname.includes('vercel.app')) {
    return null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const subdomain = getSubdomain(host);

  // Skip API routes, static files, Next.js internals, and test pages
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/sentry-test') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get the token (session)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;

  // Check if trying to access a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Check if trying to access an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to their dashboard
  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL(
      userRole === 'PARENT' ? '/parent/dashboard' : '/teacher/dashboard',
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Check role-based access for protected routes
  if (isProtectedRoute && isAuthenticated && userRole) {
    const allowedRoutes = roleRoutes[userRole] || [];
    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      const dashboardUrl = new URL(
        userRole === 'PARENT' ? '/parent/dashboard' : '/teacher/dashboard',
        request.url
      );
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Create response with school subdomain header
  const response = NextResponse.next();

  // Pass subdomain to downstream handlers via header
  if (subdomain) {
    response.headers.set('x-school-subdomain', subdomain);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
