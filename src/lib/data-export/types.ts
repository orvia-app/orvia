import type { CarRecord } from "@/lib/cars";
import type { Transaction } from "@/lib/finance";
import type { Note } from "@/lib/notes";
import type { QuickCapture } from "@/lib/quick-captures";
import type { Task } from "@/types";

export const PERSONAL_OS_EXPORT_VERSION = 1;

export type ExportedTheme = "dark" | "light" | "system";

export type PersonalOsExportMetadata = {
  appName: "Personal OS";
  appVersion: string;
  exportVersion: typeof PERSONAL_OS_EXPORT_VERSION;
  exportedAt: string;
};

export type PersonalOsExportData = {
  tasks: Task[];
  notes: Note[];
  financeTransactions: Transaction[];
  cars: CarRecord[];
  quickCaptures: QuickCapture[];
  theme: ExportedTheme | null;
};

export type PersonalOsExport = {
  metadata: PersonalOsExportMetadata;
  data: PersonalOsExportData;
};
