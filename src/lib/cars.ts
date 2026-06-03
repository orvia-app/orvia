import { createLocalEntityRepository } from "@/core/repositories/local-json-repository";
import { STORAGE_KEYS } from "@/lib/storage";

export type CarRecord = {
  id: string;
  name: string;
  owner: string;
  mileage: string;
  notes: string;
};

const LEGACY_DEFAULT_CARS: readonly CarRecord[] = [
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

export const carRepository = createLocalEntityRepository<CarRecord>({
  key: STORAGE_KEYS.cars,
  validate: isCarRecord,
});

function isLegacyDefaultCar(car: CarRecord): boolean {
  return LEGACY_DEFAULT_CARS.some((defaultCar) => {
    return (
      car.id === defaultCar.id &&
      car.name === defaultCar.name &&
      car.owner === defaultCar.owner &&
      car.mileage === defaultCar.mileage &&
      car.notes === defaultCar.notes
    );
  });
}

function removeLegacyDefaultCars(cars: CarRecord[]): CarRecord[] {
  return cars.filter((car) => !isLegacyDefaultCar(car));
}

export function getStoredCars(): CarRecord[] {
  return removeLegacyDefaultCars(carRepository.list());
}

export function getCars(): CarRecord[] {
  return getStoredCars();
}

export function saveCars(cars: readonly CarRecord[]): void {
  carRepository.save(removeLegacyDefaultCars([...cars]));
}

export function ensureCarsSeeded(): CarRecord[] {
  return getStoredCars();
}

export function createCar(car: CarRecord): CarRecord[] {
  const cars = getCars();
  const nextCars = [...cars, car];

  saveCars(nextCars);

  return nextCars;
}
