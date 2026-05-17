// =============================================================================
// TEMPLATE / MOCK DATA — DELETE THIS FILE when Supabase is connected.
// In app/page.tsx, replace `import { MOCK_LOCATIONS }` with a Supabase fetch.
// =============================================================================

import type { Location } from "./types";

export const MOCK_LOCATIONS: Location[] = [
  {
    id: "mock-1",
    name: "Webster Eddy Food Pantry",
    address: "1280 Webster St, San Francisco, CA 94115",
    lat: 37.7837,
    lng: -122.4296,
    hours: "Wednesdays 8:30 am – 9:30 am",
    description: "Accessible entrance. Enrollment available every distribution. Serves all San Francisco zip codes.",
    category: "food_bank",
  },
  {
    id: "mock-2",
    name: "Tenderloin Community Pantry",
    address: "145 Taylor St, San Francisco, CA 94102",
    lat: 37.7832,
    lng: -122.4119,
    hours: "Mon & Thu 10:00 am – 12:00 pm",
    description: "Walk-up service. No ID or enrollment required.",
    category: "food_bank",
  },
  {
    id: "mock-3",
    name: "Mission Neighborhood Food Hub",
    address: "3300 Mission St, San Francisco, CA 94110",
    lat: 37.7424,
    lng: -122.4216,
    hours: "Tuesdays & Fridays 9:00 am – 11:00 am",
    description: "Bilingual staff (English/Spanish). Fresh produce when available.",
    category: "food_bank",
  },
];
