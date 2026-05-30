import { incrementHelpful } from "@/lib/comments-repository";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  try {
    await incrementHelpful(id);
    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Comment not found") {
      return json({ error: "Comment not found" }, 404);
    }
    return json({ error: "Failed to increment helpful count" }, 500);
  }
}
