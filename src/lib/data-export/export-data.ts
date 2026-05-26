import { getStoredCars } from "@/lib/cars";
import { getTransactions } from "@/lib/finance";
import { getStoredNotes } from "@/lib/notes";
import { getQuickCaptures } from "@/lib/quick-captures";
import { safeReadStorage, STORAGE_KEYS } from "@/lib/storage";
import { getStoredTasks } from "@/lib/tasks";
import {
  PERSONAL_OS_EXPORT_VERSION,
  type ExportedTheme,
  type PersonalOsExport,
} from "@/lib/data-export/types";

const APP_NAME = "Personal OS";
const APP_VERSION_PLACEHOLDER = "0.1.0-local";

function readStoredTheme(): ExportedTheme | null {
  const theme = safeReadStorage<unknown>(STORAGE_KEYS.theme, null);

  if (theme === "dark" || theme === "light" || theme === "system") {
    return theme;
  }

  return null;
}

export function createPersonalOsExport(now = new Date()): PersonalOsExport {
  return {
    metadata: {
      appName: APP_NAME,
      appVersion: APP_VERSION_PLACEHOLDER,
      exportVersion: PERSONAL_OS_EXPORT_VERSION,
      exportedAt: now.toISOString(),
    },
    data: {
      tasks: getStoredTasks(),
      notes: getStoredNotes(),
      financeTransactions: getTransactions(),
      cars: getStoredCars(),
      quickCaptures: getQuickCaptures(),
      theme: readStoredTheme(),
    },
  };
}

export function serializePersonalOsExport(
  dataExport: PersonalOsExport,
): string {
  return JSON.stringify(dataExport, null, 2);
}

export function getPersonalOsExportFileName(
  dataExport: PersonalOsExport,
): string {
  const date = dataExport.metadata.exportedAt.split("T")[0] || "export";

  return `personal-os-export-${date}.json`;
}
