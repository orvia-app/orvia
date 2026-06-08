export const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfRFRkfmqI-VnoXnTwcSY3E87BVyqvV2wMv1HbI3LlwMM-rMQ/viewform?hl=en";

const PLACEHOLDER_VALUES = new Set([
  "",
  "https://forms.google.com/PLACEHOLDER",
  "https://forms.gle/PLACEHOLDER",
]);

export function isFeedbackUrlConfigured(url = FEEDBACK_URL) {
  return !PLACEHOLDER_VALUES.has(url.trim());
}
