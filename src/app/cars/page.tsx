"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Car } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  ensureCarsSeeded,
  saveCars,
  type CarRecord,
} from "@/lib/cars";

const SERVICE_REMINDERS = [
  "Oil change",
  "Insurance",
  "Tires",
  "Alignment",
  "Brakes",
] as const;

const emptyForm = {
  name: "",
  owner: "",
  mileage: "",
  notes: "",
};

export default function CarsPage() {
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setCars(ensureCarsSeeded());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveCars(cars);
  }, [cars, storageReady]);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const newCar: CarRecord = {
      id: Date.now().toString(),
      name,
      owner: form.owner.trim(),
      mileage: form.mileage.trim(),
      notes: form.notes.trim(),
    };
    setCars((prev) => [...prev, newCar]);
    closeModal();
  }

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <Car className="h-6 w-6 text-zinc-800 dark:text-zinc-200" aria-hidden />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                  Cars
                </h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                  Track service, expenses, reminders, and maintenance.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              + Add Car
            </button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {cars.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 px-6 py-14 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-500">
                  No vehicles yet.
                </div>
              ) : (
                cars.map((car) => (
                  <div
                    key={car.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
                  >
                    <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                      {car.name}
                    </h2>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                          Owner
                        </dt>
                        <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
                          {car.owner || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                          Mileage
                        </dt>
                        <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
                          {car.mileage || "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                        Notes
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {car.notes || "—"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                Service reminders
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {SERVICE_REMINDERS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800/80 dark:bg-black/30"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-4 dark:bg-black/70 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-car-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-car-title"
                className="text-lg font-semibold text-zinc-950 dark:text-white"
              >
                Add car
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="car-name"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="car-name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label
                  htmlFor="car-owner"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Owner
                </label>
                <input
                  id="car-owner"
                  value={form.owner}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label
                  htmlFor="car-mileage"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Mileage
                </label>
                <input
                  id="car-mileage"
                  value={form.mileage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mileage: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label
                  htmlFor="car-notes"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Notes
                </label>
                <textarea
                  id="car-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-zinc-300 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
