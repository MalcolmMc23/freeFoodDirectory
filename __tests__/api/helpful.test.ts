import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/comments-repository");

import { POST } from "@/app/api/comments/[id]/helpful/route";
import * as repo from "@/lib/comments-repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/comments/[id]/helpful", () => {
  function makeCtx(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  it("returns 200 on success", async () => {
    vi.mocked(repo.incrementHelpful).mockResolvedValueOnce(undefined);
    const res = await POST(new Request("http://localhost"), makeCtx("comment-uuid-1"));
    expect(res.status).toBe(200);
    expect(repo.incrementHelpful).toHaveBeenCalledWith("comment-uuid-1");
  });

  it("returns 404 when comment does not exist", async () => {
    vi.mocked(repo.incrementHelpful).mockRejectedValueOnce(
      new Error("Comment not found")
    );
    const res = await POST(new Request("http://localhost"), makeCtx("missing-id"));
    expect(res.status).toBe(404);
  });

  it("returns 500 on unexpected database error", async () => {
    vi.mocked(repo.incrementHelpful).mockRejectedValueOnce(
      new Error("connection timeout")
    );
    const res = await POST(new Request("http://localhost"), makeCtx("comment-uuid-1"));
    expect(res.status).toBe(500);
  });
});
