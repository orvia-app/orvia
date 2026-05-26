export type TagId = `tag:${string}`;

export type TagSource = "manual" | "derived" | "system";

export type Tag = {
  id: TagId;
  label: string;
  slug: string;
  source: TagSource;
};
