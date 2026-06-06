import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Automations",
  description:
    "How Free Food Maps keeps listings fresh. Malcolm, our AI agent, calls, emails, and texts food distribution sites on a recurring schedule.",
  alternates: { canonical: "/automations" },
};

const TASKS = [
  {
    title: "Phone Calls",
    description:
      "Malcolm rings each location's published phone line on a recurring schedule to confirm hours and whether food is still available that day.",
  },
  {
    title: "Emails",
    description:
      "He sends short check-ins to site coordinators to verify weekly schedules and catch closures, holidays, and waitlist changes early.",
  },
  {
    title: "Text Messages",
    description:
      "For sites with SMS-friendly contacts, Malcolm sends a quick text to confirm distribution times before listings go stale.",
  },
  {
    title: "Daily Sweep",
    description:
      "Every day Malcolm re-runs the loop — call, email, text — so the map reflects the most current info we can reasonably get.",
  },
];

export default function AutomationsPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1 className={styles.heading}>Automations</h1>
      <p className={styles.intro}>
        Meet <strong>Malcolm</strong> — our AI agent. He orchestrates the boring,
        repetitive work of keeping listings accurate so volunteers can focus on
        bigger problems. Here&rsquo;s what he does on a recurring schedule:
      </p>
      <ul className={styles.list}>
        {TASKS.map((task) => (
          <li key={task.title} className={styles.item}>
            <h2 className={styles.task}>{task.title}</h2>
            <p className={styles.description}>{task.description}</p>
          </li>
        ))}
      </ul>
      <p className={styles.disclaimer}>
        Malcolm is fast, but he&rsquo;s still an AI and can make mistakes —
        misheard hours, missed voicemails, the occasional hallucination. If
        something on the map looks wrong, please{" "}
        <a href="mailto:malcolmemcdonald@gmail.com">email us</a> and a human
        will fix it.
      </p>
    </main>
  );
}
