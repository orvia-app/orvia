export const ORVIA_CAPTURE_CREATED_EVENT = "orvia:capture-created";

export function notifyCaptureCreated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ORVIA_CAPTURE_CREATED_EVENT));
}
