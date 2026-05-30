import { flagComment } from "@/lib/comments-repository";
import { sendAdminEmail } from "@/lib/email";

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
    const result = await flagComment(id);

    if (!result.is_visible) {
      await sendAdminEmail(
        "Comment auto-hidden: 5 flags reached",
        `Comment ID ${id} has been auto-hidden after receiving 5 flags.\n\nReview it in your Supabase dashboard.`
      );
    }

    return json({ flag_count: result.flag_count, is_visible: result.is_visible });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Comment not found") {
      return json({ error: "Comment not found" }, 404);
    }
    return json({ error: "Failed to flag comment" }, 500);
  }
}
