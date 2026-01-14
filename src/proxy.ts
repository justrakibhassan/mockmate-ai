import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/interview(.*)',
]);

// Simple in-memory rate limit (Reset on edge cold starts)
const rateLimitMap = new Map();

export default clerkMiddleware(async (auth, req) => {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const limit = 100; // 100 requests
  const windowMs = 60 * 1000; // 1 minute

  const now = Date.now();
  const userRate = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userRate.startTime > windowMs) {
    userRate.count = 1;
    userRate.startTime = now;
  } else {
    userRate.count++;
  }

  rateLimitMap.set(ip, userRate);

  if (userRate.count > limit) {
    return new Response('Too Many Requests', { status: 429 });
  }

  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
