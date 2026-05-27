import type { SyncDeviceId } from "@/core/sync/types";

export type SyncDeviceDescriptor = {
  id: SyncDeviceId;
  label?: string;
  createdAt?: string;
};

function slugifyDeviceSeed(seed: string): string {
  const normalized = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "local";
}

export function createDeterministicDeviceId(seed: string): SyncDeviceId {
  return `device:${slugifyDeviceSeed(seed)}`;
}

export function createLocalDeviceDescriptor(input: {
  seed: string;
  label?: string;
  createdAt?: string;
}): SyncDeviceDescriptor {
  return {
    id: createDeterministicDeviceId(input.seed),
    label: input.label,
    createdAt: input.createdAt,
  };
}

export function isSyncDeviceId(value: unknown): value is SyncDeviceId {
  return typeof value === "string" && /^device:[a-z0-9-]+$/.test(value);
}
