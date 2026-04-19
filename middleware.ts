import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const buckets = new Map<string, Bucket>();

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

export function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const key = `${ip}:${request.nextUrl.pathname}`;

  if (isLimited(key)) {
    return NextResponse.json(
      { error: "Trop de requetes, reessayez plus tard." },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
