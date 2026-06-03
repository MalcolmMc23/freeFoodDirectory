const PIXEL_ID = "27030139720012639";
const API_VERSION = "v19.0";

interface UserData {
  client_ip_address?: string;
  client_user_agent?: string;
  /** _fbc cookie value */
  fbc?: string;
  /** _fbp cookie value */
  fbp?: string;
}

interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  action_source: "website";
  event_source_url?: string;
  user_data: UserData;
  custom_data?: Record<string, unknown>;
}

export function buildPageViewEvent(opts: {
  url: string;
  ip?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  eventId?: string;
}): CAPIEvent {
  return {
    event_name: "PageView",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: opts.url,
    ...(opts.eventId ? { event_id: opts.eventId } : {}),
    user_data: {
      ...(opts.ip ? { client_ip_address: opts.ip } : {}),
      ...(opts.userAgent ? { client_user_agent: opts.userAgent } : {}),
      ...(opts.fbc ? { fbc: opts.fbc } : {}),
      ...(opts.fbp ? { fbp: opts.fbp } : {}),
    },
  };
}

/**
 * Send events to the Meta Conversions API.
 * No-ops gracefully if META_PIXEL_ACCESS_TOKEN is not set.
 * Fire-and-forget: do not await in render paths.
 */
export async function sendMetaEvents(events: CAPIEvent[]): Promise<void> {
  const accessToken = process.env.META_PIXEL_ACCESS_TOKEN;
  if (!accessToken) return;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: events,
          access_token: accessToken,
          ...(process.env.META_TEST_EVENT_CODE
            ? { test_event_code: process.env.META_TEST_EVENT_CODE }
            : {}),
        }),
      }
    );
    if (!res.ok) {
      console.error("[meta-capi] error:", await res.text());
    }
  } catch (err) {
    console.error("[meta-capi] fetch failed:", err);
  }
}
