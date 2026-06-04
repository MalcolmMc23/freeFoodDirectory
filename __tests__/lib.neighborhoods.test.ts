import { describe, expect, it } from "vitest";
import {
  getNeighborhoodByCityAndSlug,
  getNeighborhoodByLocation,
  getNeighborhoodUrl,
} from "../lib/neighborhoods";

describe("neighborhood helpers", () => {
  it("builds city-aware neighborhood urls", () => {
    expect(
      getNeighborhoodUrl({ citySlug: "los-angeles", slug: "echo-park" }),
    ).toBe("/los-angeles/neighborhood/echo-park");
  });

  it("looks up a city-specific neighborhood by route params", () => {
    expect(
      getNeighborhoodByCityAndSlug("san-francisco", "sunset")?.name,
    ).toBe("Sunset District");
    expect(
      getNeighborhoodByCityAndSlug("los-angeles", "echo-park")?.name,
    ).toBe("Echo Park");
    expect(
      getNeighborhoodByCityAndSlug("new-york-city", "harlem")?.name,
    ).toBe("Harlem");
  });

  it("maps zip codes back to the correct neighborhood", () => {
    expect(
      getNeighborhoodByLocation({ postalCode: "94116" })?.slug,
    ).toBe("sunset");
    expect(
      getNeighborhoodByLocation({ postalCode: "90026" })?.slug,
    ).toBe("echo-park");
    expect(
      getNeighborhoodByLocation({ postalCode: "10027" })?.slug,
    ).toBe("harlem");
  });
});
