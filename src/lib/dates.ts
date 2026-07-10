import { subDays } from "date-fns";
import type { DateRange } from "./constants";

export const getRangeStart = (range: DateRange) => {
  switch (range) {
    case "7d":
      return subDays(new Date(), 7);
    case "30d":
      return subDays(new Date(), 30);
    case "90d":
      return subDays(new Date(), 90);
    default:
      return subDays(new Date(), 30);
  }
};

export const parseSelectorsInput = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
