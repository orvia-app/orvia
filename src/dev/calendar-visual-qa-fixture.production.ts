import type { IanaTimeZone, LocalDate, ScheduleProjectionResult, UtcInstant } from "@/core/schedule/domain";

const unavailable = (): never => {
  throw new Error("Calendar visual QA fixture is unavailable in production");
};

export const calendarVisualQaDate = "1970-01-01" as LocalDate;
export const calendarVisualQaNow = "1970-01-01T00:00:00.000Z" as UtcInstant;
export const calendarVisualQaZone = "UTC" as IanaTimeZone;

export function createCalendarVisualQaProjection(ownerId: string): ScheduleProjectionResult {
  void ownerId;
  return unavailable();
}
