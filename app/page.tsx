import { HomePageClient } from "../components/home-page-client";
import { getLocations } from "../lib/locations";

export default async function HomePage() {
  const locations = await getLocations();

  return <HomePageClient locations={locations} />;
}
