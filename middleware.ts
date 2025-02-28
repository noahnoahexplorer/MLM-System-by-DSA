import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/middleware-helper';

// Define route permissions
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['user', 'admin'],
  '/admin': ['admin'],
  '/settings': ['user', 'admin'],
  '/weekly-commission': ['user', 'admin'],
  // Add more routes and their required roles
};

// Define public routes that don't need authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/unauthorized', '/debug'];

export async function middleware(req: NextRequest) {
  const { supabase, response } = createMiddlewareClient(req);
  
  // Get the pathname
  const path = req.nextUrl.pathname;
  
  // Skip middleware for public routes and static files
  if (publicRoutes.some(route => path.startsWith(route)) || 
      path.startsWith('/_next') || 
      path.startsWith('/api') ||
      path.includes('.')) {
    return NextResponse.next();
  }
  
  console.log(`Middleware processing path: ${path}`);
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`Session exists: ${!!session}`);
    
    // Check if this path requires permissions
    const matchedRoute = Object.keys(routePermissions).find(route => 
      path === route || path.startsWith(`${route}/`)
    );
    
    const requiredRoles = matchedRoute ? routePermissions[matchedRoute] : null;
    
    console.log(`Required roles: ${requiredRoles}`);
    
    // If no specific roles required, continue
    if (!requiredRoles) {
      console.log('No roles required, continuing');
      return response;
    }
    
    // If no session, redirect to login
    if (!session) {
      console.log('No session, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    console.log(`User role: ${profile?.role}`);
    
    // Check if user has required role
    if (!profile || !requiredRoles.includes(profile.role)) {
      console.log('User does not have required role, redirecting to unauthorized');
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    console.log('User has required role, continuing');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

// Add a matcher to specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 