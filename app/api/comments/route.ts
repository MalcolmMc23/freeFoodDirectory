import {
  getComments,
  createComment,
  countRecentCommentsByIp,
} from "@/lib/comments-repository";
import { getClientIp, hashIp } from "@/lib/ip-hash";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return json({ error: "locationId is required" }, 400);
  }

  try {
    const comments = await getComments(locationId);
    return json({ comments });
  } catch {
    return json({ error: "Failed to fetch comments" }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { location_id, comment_text, display_name, _honeypot } = body;

  // Silent reject for bots
  if (_honeypot) {
    return json({ ok: true });
  }

  if (!location_id || typeof location_id !== "string") {
    return json({ error: "location_id is required" }, 400);
  }

  if (!comment_text || typeof comment_text !== "string") {
    return json({ error: "comment_text is required" }, 400);
  }

  if (comment_text.length < 3) {
    return json(
      { error: "Comment must be at least 3 characters" },
      400
    );
  }

  if (comment_text.length > 280) {
    return json(
      { error: "Comment must be 280 characters or less" },
      400
    );
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const recentCount = await countRecentCommentsByIp(ipHash);
  if (recentCount >= 3) {
    return json(
      { error: "Rate limit exceeded. Try again tomorrow." },
      429
    );
  }

  const name =
    typeof display_name === "string" && display_name.trim()
      ? display_name.trim()
      : "A visitor";

  try {
    const comment = await createComment({
      location_id,
      comment_text,
      display_name: name,
      ip_hash: ipHash,
    });
    return json({ comment }, 201);
  } catch {
    return json({ error: "Failed to save comment" }, 500);
  }
}
