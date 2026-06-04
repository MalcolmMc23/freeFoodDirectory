import type { Location } from "./types";

type ScheduleFields = Pick<Location, "distributionDay" | "distributionTimeText" | "nextDistributionDates">;

export function getLocationScheduleSummary(location: ScheduleFields): string | null {
  const nextDate = location.nextDistributionDates.find((date) => date.trim().length > 0);

  if (nextDate && location.distributionTimeText) {
    return `${nextDate} · ${location.distributionTimeText}`;
  }

  if (nextDate) return nextDate;
  if (location.distributionTimeText) return location.distributionTimeText;
  if (location.distributionDay) return location.distributionDay;

  return null;
}
