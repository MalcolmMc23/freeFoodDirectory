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
        url: "https://freefoodmaps.com",
        description:
          "A directory of free food distribution locations in San Francisco. No ID, no questions required.",
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
        name: "Free Food Locations in San Francisco",
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
