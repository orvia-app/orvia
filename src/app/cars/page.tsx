"use client";
import { Input, Textarea } from "@/components/ui/Field";


import { useDialogFocus } from "@/components/ui/useDialogFocus";

import { useEffect, useState, type FormEvent } from "react";
import { Car, X } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { AppShell } from "@/components/AppShell";
import {
  ensureCarsSeeded,
  saveCars,
  type CarRecord,
} from "@/lib/cars";

const SERVICE_REMINDERS = [
  "cars.oil",
  "cars.insurance",
  "cars.tires",
  "cars.alignment",
  "cars.brakes",
] as const;

const emptyForm = {
  name: "",
  owner: "",
  mileage: "",
  notes: "",
};

export default function CarsPage() {
  const { t } = useI18n();
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const dialogRef = useDialogFocus(modalOpen);

  useEffect(() => {
    setCars(ensureCarsSeeded());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveCars(cars);
  }, [cars, storageReady]);

  useEffect(() => {
    if (!modalOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setModalOpen(false); setForm(emptyForm); }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [modalOpen]);

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
      id: crypto.randomUUID(),
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
      <div className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-zinc-200 dark:bg-zinc-900">
                <Car className="h-6 w-6 text-foreground" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t("nav.cars")}
                </h1>
                <p className="mt-2 [overflow-wrap:anywhere] text-sm text-muted sm:text-base">
                  {t("cars.description")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {t("cars.add")}
            </button>
          </div>

          <p className="mt-4 text-sm text-muted">{t("labs.localNotice")}</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {cars.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-subtle px-6 py-14 text-center text-sm text-muted">
                  {t("cars.empty")}
                </div>
              ) : (
                cars.map((car) => (
                  <div
                    key={car.id}
                    className="rounded-xl border border-line bg-surface p-5 sm:p-6"
                  >
                    <h2 className="min-w-0 [overflow-wrap:anywhere] text-lg font-semibold text-foreground sm:text-xl">
                      {car.name}
                    </h2>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted">
                          {t("cars.owner")}
                        </dt>
                        <dd className="mt-1 [overflow-wrap:anywhere] text-foreground">
                          {car.owner || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted">
                          {t("cars.mileage")}
                        </dt>
                        <dd className="mt-1 [overflow-wrap:anywhere] text-foreground">
                          {car.mileage || "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        {t("common.notes")}
                      </p>
                      <p className="mt-1 [overflow-wrap:anywhere] text-sm leading-relaxed text-muted">
                        {car.notes || "—"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="min-w-0 [overflow-wrap:anywhere] text-lg font-semibold text-foreground">
                {t("cars.reminders")}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {SERVICE_REMINDERS.map((item) => (
                  <li
                    key={t(item)}
                    className="flex items-center gap-2 rounded-lg border border-line bg-subtle px-3 py-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-black/70 sm:items-center sm:p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
        ref={dialogRef}
        tabIndex={-1}
            aria-modal="true"
            aria-labelledby="new-car-title"
            className="orvia-dialog max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-xl sm:max-h-[90vh] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-car-title"
                className="min-w-0 [overflow-wrap:anywhere] text-lg font-semibold text-foreground"
              >
                {t("cars.add")}
              </h2>
              <button
                type="button"
                aria-label={t("common.close")}
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-zinc-600"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="car-name"
                  className="block text-sm font-medium text-muted"
                >
                  {t("cars.name")} <span className="text-red-400">*</span>
                </label>
                <Input
                  id="car-name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1.5 w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="car-owner"
                  className="block text-sm font-medium text-muted"
                >
                  {t("cars.owner")}
                </label>
                <Input
                  id="car-owner"
                  value={form.owner}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner: e.target.value }))
                  }
                  className="mt-1.5 w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="car-mileage"
                  className="block text-sm font-medium text-muted"
                >
                  {t("cars.mileage")}
                </label>
                <Input
                  id="car-mileage"
                  value={form.mileage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mileage: e.target.value }))
                  }
                  className="mt-1.5 w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="car-notes"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.notes")}
                </label>
                <Textarea
                  id="car-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1.5 w-full"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
