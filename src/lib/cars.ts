import {
  hasCompletedLocalDataReset,
  safeReadStorage,
  safeWriteStorage,
  STORAGE_KEYS,
} from "@/lib/storage";

export type CarRecord = {
  id: string;
  name: string;
  owner: string;
  mileage: string;
  notes: string;
};

export const DEFAULT_CARS: readonly CarRecord[] = [
  {
    id: "car-1",
    name: "Infiniti G37x",
    owner: "Me",
    mileage: "",
    notes: "Track maintenance, fuel, alignment, insurance, repairs.",
  },
  {
    id: "car-2",
    name: "Audi A3 8P",
    owner: "Wife",
    mileage: "",
    notes: "Track service, insurance, maintenance and expenses.",
  },
];

export function isCarRecord(value: unknown): value is CarRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const car = value as Partial<CarRecord>;

  return (
    typeof car.id === "string" &&
    typeof car.name === "string" &&
    car.name.trim().length > 0 &&
    typeof car.owner === "string" &&
    typeof car.mileage === "string" &&
    typeof car.notes === "string"
  );
}

export function getStoredCars(): CarRecord[] {
  const storedCars = safeReadStorage<unknown[]>(STORAGE_KEYS.cars, []);

  return Array.isArray(storedCars) ? storedCars.filter(isCarRecord) : [];
}

export function getCars(): CarRecord[] {
  const storedCars = getStoredCars();

  if (hasCompletedLocalDataReset()) {
    return storedCars;
  }

  return storedCars.length > 0 ? storedCars : [...DEFAULT_CARS];
}

export function saveCars(cars: readonly CarRecord[]): void {
  safeWriteStorage(STORAGE_KEYS.cars, cars);
}

export function ensureCarsSeeded(): CarRecord[] {
  const storedCars = getStoredCars();

  if (storedCars.length > 0) {
    return storedCars;
  }

  if (hasCompletedLocalDataReset()) {
    return [];
  }

  const defaultCars = [...DEFAULT_CARS];
  saveCars(defaultCars);

  return defaultCars;
}

export function createCar(car: CarRecord): CarRecord[] {
  const cars = getCars();
  const nextCars = [...cars, car];

  saveCars(nextCars);

  return nextCars;
}
