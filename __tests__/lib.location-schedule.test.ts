import { describe, expect, it } from "vitest";
import { getLocationScheduleSummary } from "../lib/location-schedule";

describe("getLocationScheduleSummary", () => {
  it("prefers the next distribution date when available", () => {
    expect(
      getLocationScheduleSummary({
        distributionDay: "Thursday",
        distributionTimeText: "1:30 pm - 4:30 pm",
        nextDistributionDates: ["Thursday, 6/11"],
      }),
    ).toBe("Thursday, 6/11 · 1:30 pm - 4:30 pm");
  });

  it("falls back to distribution time text when no dated schedule is present", () => {
    expect(
      getLocationScheduleSummary({
        distributionDay: "Monday",
        distributionTimeText: "Mon: 2:15 pm - 4:00 pm",
        nextDistributionDates: [],
      }),
    ).toBe("Mon: 2:15 pm - 4:00 pm");
  });

  it("falls back to distribution day when that is all we have", () => {
    expect(
      getLocationScheduleSummary({
        distributionDay: "Wednesday",
        distributionTimeText: null,
        nextDistributionDates: [],
      }),
    ).toBe("Wednesday");
  });
});
