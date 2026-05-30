import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/comments-repository");
vi.mock("@/lib/email");
vi.mock("@/lib/ip-hash", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  hashIp: vi.fn().mockReturnValue("hashed-ip-abc123"),
}));

import { GET, POST } from "@/app/api/comments/route";
import { POST as flagPost } from "@/app/api/comments/[id]/flag/route";
import * as repo from "@/lib/comments-repository";
import * as emailLib from "@/lib/email";

function makeRequest(
  url: string,
  options?: { method?: string; body?: unknown }
): Request {
  const init: RequestInit = { method: options?.method ?? "GET" };
  if (options?.body !== undefined) {
    init.method = "POST";
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return new Request(url, init);
}

const MOCK_COMMENT = {
  id: "comment-uuid-1",
  location_id: "loc-uuid-1",
  comment_text: "They had lots of produce today",
  display_name: "A visitor",
  flag_count: 0,
  is_visible: true,
  created_at: "2026-05-30T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/comments
// ---------------------------------------------------------------------------
describe("GET /api/comments", () => {
  it("returns 400 when locationId param is missing", async () => {
    const res = await GET(makeRequest("http://localhost/api/comments"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 200 with comments array on success", async () => {
    vi.mocked(repo.getComments).mockResolvedValueOnce([MOCK_COMMENT]);
    const res = await GET(
      makeRequest("http://localhost/api/comments?locationId=loc-uuid-1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toEqual([MOCK_COMMENT]);
    expect(repo.getComments).toHaveBeenCalledWith("loc-uuid-1");
  });

  it("returns empty array when location has no comments", async () => {
    vi.mocked(repo.getComments).mockResolvedValueOnce([]);
    const res = await GET(
      makeRequest("http://localhost/api/comments?locationId=loc-uuid-1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toEqual([]);
  });

  it("returns 500 when database throws", async () => {
    vi.mocked(repo.getComments).mockRejectedValueOnce(new Error("db error"));
    const res = await GET(
      makeRequest("http://localhost/api/comments?locationId=loc-uuid-1")
    );
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/comments
// ---------------------------------------------------------------------------
describe("POST /api/comments", () => {
  beforeEach(() => {
    vi.mocked(repo.countRecentCommentsByIp).mockResolvedValue(0);
  });

  it("returns 400 when location_id is missing", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: { comment_text: "hello there" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when comment_text is missing", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when comment is shorter than 3 chars", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1", comment_text: "hi" },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/3/);
  });

  it("returns 400 when comment exceeds 280 chars", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1", comment_text: "a".repeat(281) },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/280/);
  });

  it("returns 200 silently (no insert) when honeypot field is filled", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: {
          location_id: "loc-uuid-1",
          comment_text: "valid comment",
          _honeypot: "i am a bot",
        },
      })
    );
    expect(res.status).toBe(200);
    expect(repo.createComment).not.toHaveBeenCalled();
  });

  it("returns 429 when IP has submitted 3 comments in the last 24h", async () => {
    vi.mocked(repo.countRecentCommentsByIp).mockResolvedValueOnce(3);
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1", comment_text: "valid comment" },
      })
    );
    expect(res.status).toBe(429);
  });

  it("creates comment and returns 201 on success", async () => {
    vi.mocked(repo.createComment).mockResolvedValueOnce(MOCK_COMMENT);
    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1", comment_text: "They had produce" },
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.comment).toEqual(MOCK_COMMENT);
  });

  it("defaults display_name to 'A visitor' when not provided", async () => {
    vi.mocked(repo.createComment).mockResolvedValueOnce(MOCK_COMMENT);
    await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1", comment_text: "Great place" },
      })
    );
    expect(repo.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "A visitor" })
    );
  });

  it("uses provided display_name when given", async () => {
    vi.mocked(repo.createComment).mockResolvedValueOnce({
      ...MOCK_COMMENT,
      display_name: "Jane",
    });
    await POST(
      makeRequest("http://localhost/api/comments", {
        body: {
          location_id: "loc-uuid-1",
          comment_text: "Great place",
          display_name: "Jane",
        },
      })
    );
    expect(repo.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Jane" })
    );
  });

  it("hashes the client IP before storing", async () => {
    vi.mocked(repo.createComment).mockResolvedValueOnce(MOCK_COMMENT);
    await POST(
      makeRequest("http://localhost/api/comments", {
        body: { location_id: "loc-uuid-1", comment_text: "Good spot" },
      })
    );
    expect(repo.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ ip_hash: "hashed-ip-abc123" })
    );
  });
});

// ---------------------------------------------------------------------------
// POST /api/comments/[id]/flag
// ---------------------------------------------------------------------------
describe("POST /api/comments/[id]/flag", () => {
  function makeFlagCtx(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  it("returns 404 when comment does not exist", async () => {
    vi.mocked(repo.flagComment).mockRejectedValueOnce(
      new Error("Comment not found")
    );
    const res = await flagPost(
      new Request("http://localhost"),
      makeFlagCtx("missing-id")
    );
    expect(res.status).toBe(404);
  });

  it("returns updated flag_count and is_visible on success", async () => {
    vi.mocked(repo.flagComment).mockResolvedValueOnce({
      flag_count: 2,
      is_visible: true,
    });
    const res = await flagPost(
      new Request("http://localhost"),
      makeFlagCtx("comment-uuid-1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.flag_count).toBe(2);
    expect(body.is_visible).toBe(true);
  });

  it("auto-hides comment and sends admin email at 5 flags", async () => {
    vi.mocked(repo.flagComment).mockResolvedValueOnce({
      flag_count: 5,
      is_visible: false,
    });
    vi.mocked(emailLib.sendAdminEmail).mockResolvedValueOnce(undefined);

    const res = await flagPost(
      new Request("http://localhost"),
      makeFlagCtx("comment-uuid-1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.is_visible).toBe(false);
    expect(emailLib.sendAdminEmail).toHaveBeenCalledOnce();
  });

  it("does not send admin email when flag_count is below 5", async () => {
    vi.mocked(repo.flagComment).mockResolvedValueOnce({
      flag_count: 3,
      is_visible: true,
    });
    await flagPost(
      new Request("http://localhost"),
      makeFlagCtx("comment-uuid-1")
    );
    expect(emailLib.sendAdminEmail).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected database error", async () => {
    vi.mocked(repo.flagComment).mockRejectedValueOnce(
      new Error("connection failed")
    );
    const res = await flagPost(
      new Request("http://localhost"),
      makeFlagCtx("comment-uuid-1")
    );
    expect(res.status).toBe(500);
  });
});
