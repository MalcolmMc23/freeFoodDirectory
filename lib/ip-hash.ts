import { createHmac } from "node:crypto";

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET ?? "dev-fallback-secret";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
