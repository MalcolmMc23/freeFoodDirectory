import { HomePageClient } from "../components/home-page-client";
import { LocationList } from "../components/location-list";
import { getLocations } from "../lib/locations";
import { formatLocationAddress } from "../lib/types";

// Refresh Supabase-backed data at most every 60s so rows added to the DB
// appear without a redeploy. Without this, the page is statically built
// and Supabase rows are frozen at build time.
export const revalidate = 60;

export default async function HomePage() {
  const locations = await getLocations();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://freefoodmaps.com/#organization",
        name: "Free Food Maps",
        alternateName: "freefoodmaps.com",
        url: "https://freefoodmaps.com",
        logo: {
          "@type": "ImageObject",
          url: "https://freefoodmaps.com/assets/logo_transparent_background.png",
        },
        description:
          "A free, open directory of food banks, soup kitchens, pantries, and community kitchens in San Francisco and Los Angeles. Updated weekly.",
        areaServed: [
          { "@type": "City", name: "San Francisco", sameAs: "https://www.wikidata.org/wiki/Q62" },
          { "@type": "City", name: "Los Angeles", sameAs: "https://www.wikidata.org/wiki/Q65" },
        ],
        sameAs: [
          "https://freefoodmaps.com",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          email: "malcolm.e.mcdonald@gmail.com",
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://freefoodmaps.com/#website",
        url: "https://freefoodmaps.com",
        name: "Free Food Maps",
        publisher: { "@id": "https://freefoodmaps.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://freefoodmaps.com/?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: "Free Food Locations in Free Food Maps",
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
            ...(loc.lat && loc.lng
              ? { geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng } }
              : {}),
            ...(loc.siteUrl ? { url: loc.siteUrl } : {}),
            description: `Free food distribution at ${formatLocationAddress(loc)}`,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient locations={locations} locationList={<LocationList locations={locations} />} />
    </>
  );
}
