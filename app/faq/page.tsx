import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Free Food Maps — how the map works, how often listings are updated, and how to report incorrect information.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "How do I use the map?",
    a: 'Click "Show Map" on the homepage to open the map. Tap any pin to see details about that location — name, address, and distribution hours. Then head there.',
  },
  {
    q: "How often is the data updated?",
    a: "Listings are updated weekly from publicly available sources. If something looks off, it may have changed since our last update — see below for how to flag it.",
  },
  {
    q: "Is this only for San Francisco?",
    a: "Yes, for now. We're focused on getting SF right before expanding to other cities.",
  },
  {
    q: "What if a listing is wrong or outdated?",
    a: "Email us at malcolmemcdonald@gmail.com and we'll fix it as fast as we can.",
  },
  {
    q: "Who made this?",
    a: "Two nerds trying to help the community by building something useful.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.page}>
        <Link href="/" className={styles.back}>
          ← Back
        </Link>
        <h1 className={styles.heading}>FAQ</h1>
        <dl className={styles.list}>
          {FAQS.map(({ q, a }) => (
            <div key={q} className={styles.item}>
              <dt className={styles.question}>{q}</dt>
              <dd className={styles.answer}>{a}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  );
}
