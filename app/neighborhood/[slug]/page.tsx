import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocationList } from "../../../components/location-list";
import { getLocations } from "../../../lib/locations";
import { SF_NEIGHBORHOODS, getNeighborhoodBySlug } from "../../../lib/neighborhoods";
import styles from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SF_NEIGHBORHOODS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = getNeighborhoodBySlug(slug);
  if (!neighborhood) return {};
  return {
    title: `Free Food in ${neighborhood.name}, San Francisco`,
    description: `${neighborhood.description}. Food banks, soup kitchens, and pantries — no ID required.`,
    alternates: { canonical: `/neighborhood/${slug}` },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params;
  const neighborhood = getNeighborhoodBySlug(slug);
  if (!neighborhood) notFound();

  const allLocations = await getLocations();
  const locations = allLocations.filter(
    (loc) => loc.postalCode && neighborhood.zips.includes(loc.postalCode),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Free Food in ${neighborhood.name}, San Francisco`,
    numberOfItems: locations.length,
    itemListElement: locations.map((loc, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: loc.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: loc.addressLine,
          addressLocality: loc.city,
          addressRegion: loc.state,
          postalCode: loc.postalCode ?? undefined,
          addressCountry: "US",
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.page}>
        <Link href="/" className={styles.back}>← Back</Link>
        <h1 className={styles.heading}>Free Food in {neighborhood.name}</h1>
        <p className={styles.sub}>
          San Francisco · {neighborhood.description.toLowerCase().replace(`free food in the ${neighborhood.name.toLowerCase()} neighborhood of san francisco`, "").replace(`free food in ${neighborhood.name.toLowerCase()} in san francisco`, "").trim() || "No ID or questions required."}
        </p>
        {locations.length === 0 ? (
          <p className={styles.empty}>
            No locations found for this neighborhood yet.{" "}
            <Link href="/">See all San Francisco locations →</Link>
          </p>
        ) : (
          <LocationList locations={locations} />
        )}
      </main>
    </>
  );
}
