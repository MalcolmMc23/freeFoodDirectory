export async function sendAdminEmail(
  subject: string,
  body: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail =
    process.env.ADMIN_EMAIL ?? "malcolm.e.mcdonald@gmail.com";
  const fromEmail =
    process.env.FROM_EMAIL ?? "noreply@freefooddirectory.com";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set, skipping:", subject);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to: adminEmail, subject, text: body }),
  });

  if (!res.ok) {
    console.error("[email] Failed to send:", subject, await res.text());
  }
}
