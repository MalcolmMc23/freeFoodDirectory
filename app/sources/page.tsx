import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Our Data Sources",
  description:
    "Free Food Maps aggregates listings from these San Francisco food assistance organizations. We update our data weekly from publicly available sources.",
  alternates: { canonical: "/sources" },
};

const SOURCES = [
  {
    name: "SF-Marin Food Bank — Food Locator",
    url: "https://foodlocator.sfmfoodbank.org",
    description:
      "The SF-Marin Food Bank operates one of the largest food bank networks in the Bay Area, running over 200 distribution sites per week across San Francisco and Marin counties.",
  },
];

export default function SourcesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Our Data Sources — Free Food Maps",
    description: "Organizations whose publicly available data powers Free Food Maps.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: SOURCES.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Organization", name: s.name, url: s.url },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.page}>
        <Link href="/" className={styles.back}>← Back</Link>
        <h1 className={styles.heading}>Our Data Sources</h1>
        <p className={styles.intro}>
          Free Food Maps aggregates listings from these San Francisco food assistance organizations.
          We scrape their publicly available data weekly and do not store or sell personal
          information. If you represent one of these organizations and need a listing corrected,{" "}
          <a href="mailto:malcolmemcdonald@gmail.com">email us</a>.
        </p>
        <ul className={styles.list}>
          {SOURCES.map((source) => (
            <li key={source.url} className={styles.item}>
              <a
                href={source.url}
                className={styles.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.name} ↗
              </a>
              <p className={styles.description}>{source.description}</p>
            </li>
          ))}
        </ul>
        <p className={styles.footer}>
          We&rsquo;re actively adding more sources. If your organization distributes free food in
          San Francisco and would like to be listed, <a href="mailto:malcolmemcdonald@gmail.com">get in touch</a>.
        </p>
      </main>
    </>
  );
}
