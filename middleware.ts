import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const buckets = new Map<string, Bucket>();
const RATE_LIMIT_WINDOW_SECONDS = Math.floor(WINDOW_MS / 1000);

const hasUpstashConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const ratelimit = hasUpstashConfig
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
      analytics: true,
      prefix: "klara:auth-rate-limit",
    })
  : null;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  return realIp || "unknown";
}

function isLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (bucket.count >= MAX_REQUESTS) return true;

  bucket.count += 1;
  buckets.set(key, bucket);
  return false;
}

export async function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const key = `${ip}:${request.nextUrl.pathname}`;

  if (ratelimit) {
    const result = await ratelimit.limit(key);

    if (!result.success) {
      return NextResponse.json(
        { error: "Trop de requetes, reessayez plus tard." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
            "Retry-After": String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));
    return response;
  }

  if (isLimited(key)) {
    return NextResponse.json(
      { error: "Trop de requetes, reessayez plus tard." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((Date.now() + WINDOW_MS) / 1000)),
          "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS),
          "X-RateLimit-Mode": "local-memory",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set("X-RateLimit-Mode", "local-memory");
  return response;
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
