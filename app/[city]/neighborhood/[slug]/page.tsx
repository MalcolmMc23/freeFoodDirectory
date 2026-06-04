import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocationList } from "../../../../components/location-list";
import { getCityBySlug } from "../../../../lib/cities";
import { getLocations } from "../../../../lib/locations";
import { getNeighborhoodByCityAndSlug, ALL_NEIGHBORHOODS } from "../../../../lib/neighborhoods";
import styles from "./page.module.css";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateStaticParams() {
  return ALL_NEIGHBORHOODS.map((neighborhood) => ({
    city: neighborhood.citySlug,
    slug: neighborhood.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const cityMeta = getCityBySlug(city);
  const neighborhood = getNeighborhoodByCityAndSlug(city, slug);

  if (!cityMeta || !neighborhood) return {};

  return {
    title: `Free Food in ${neighborhood.name}, ${cityMeta.name}`,
    description: `${neighborhood.description}. Food banks, soup kitchens, and pantries nearby.`,
    alternates: { canonical: `/${city}/neighborhood/${slug}` },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { city, slug } = await params;
  const cityMeta = getCityBySlug(city);
  const neighborhood = getNeighborhoodByCityAndSlug(city, slug);

  if (!cityMeta || !neighborhood) notFound();

  const allLocations = await getLocations();
  const locations = allLocations.filter(
    (loc) => loc.postalCode && neighborhood.zips.includes(loc.postalCode),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Free Food in ${neighborhood.name}, ${cityMeta.name}`,
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
          {cityMeta.name} · {neighborhood.description}. Food banks, soup kitchens, and pantries nearby.
        </p>
        {locations.length === 0 ? (
          <p className={styles.empty}>
            No locations found for this neighborhood yet.{" "}
            <Link href="/">See all locations →</Link>
          </p>
        ) : (
          <LocationList
            locations={locations}
            heading={`${locations.length} free food locations in ${neighborhood.name}`}
            ariaLabel={`Free food locations in ${neighborhood.name}`}
            neighborhoodCitySlugs={[neighborhood.citySlug]}
          />
        )}
      </main>
    </>
  );
}
