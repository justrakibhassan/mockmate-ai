import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/interview(.*)',
]);

// Bounded in-memory rate limiter with TTL pruning
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ENTRIES = 2000;
const LIMIT = 100; // 100 requests per minute
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string, now: number): boolean {
  // Prune expired entries periodically to prevent memory leaks
  if (rateLimitMap.size > MAX_ENTRIES) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  record.count++;
  return record.count <= LIMIT;
}

export default clerkMiddleware(async (auth, req) => {
  // Extract trusted client IP from comma-separated list
  const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const clientIp = rawIp.split(",")[0].trim() || "anonymous";

  const isAllowed = checkRateLimit(clientIp, Date.now());

  if (!isAllowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
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
