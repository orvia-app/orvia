"use client";
import { Select, Input, Textarea } from "@/components/ui/Field";


import { useDialogFocus } from "@/components/ui/useDialogFocus";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Wallet, X } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { AppShell } from "@/components/AppShell";
import {
  CURRENCIES,
  getTransactions,
  saveTransactions,
  type CurrencyCode,
  type Transaction,
  type TransactionType,
} from "@/lib/finance";

const emptyForm = {
  type: "expense" as TransactionType,
  category: "",
  amount: "",
  currency: "USD" as CurrencyCode,
  note: "",
};

export default function FinancePage() {
  const { t, locale } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const dialogRef = useDialogFocus(modalOpen);

  useEffect(() => {
    setTransactions(getTransactions());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveTransactions(transactions);
  }, [transactions, storageReady]);

  const { incomeTotal, expenseTotal, cashflow } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return {
      incomeTotal: income,
      expenseTotal: expense,
      cashflow: income - expense,
    };
  }, [transactions]);

  function formatMoney(n: number) {
    return n.toLocaleString(locale === "ua" ? "uk-UA" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

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
    const category = form.category.trim();
    const amountNum = Number(form.amount);
    if (!category || !Number.isFinite(amountNum) || amountNum <= 0) return;

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: form.type,
      category,
      amount: amountNum,
      currency: form.currency,
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);
    closeModal();
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-300/50 bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-300" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t("nav.finance")}
                </h1>
                <p className="mt-2 text-sm text-muted sm:text-base">
                  {t("finance.description")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {t("finance.add")}
            </button>
          </div>

          <p className="mt-4 text-sm text-muted">{t("labs.localNotice")}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("finance.incomeTotal")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {formatMoney(incomeTotal)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                {t("finance.mixedCurrencies")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("finance.expenseTotal")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
                {formatMoney(expenseTotal)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                {t("finance.mixedCurrencies")}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("finance.cashflow")}
              </p>
              <p
                className={
                  cashflow >= 0
                    ? "mt-2 text-2xl font-semibold text-foreground"
                    : "mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {formatMoney(cashflow)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                {t("finance.difference")}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">
              {t("finance.transactions")}
            </h2>
            {transactions.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-subtle px-6 py-14 text-center text-sm text-muted">
                {t("finance.empty")}
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {transactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 [overflow-wrap:anywhere]">
                      <p className="font-medium text-foreground">
                        {t.category}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {new Date(t.createdAt).toLocaleString(locale === "ua" ? "uk-UA" : "en-US")} ·{" "}
                        {t.currency}
                      </p>
                      {t.note ? (
                        <p className="mt-1 text-sm text-muted">
                          {t.note}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={
                        t.type === "income"
                          ? "text-lg font-semibold text-emerald-600 dark:text-emerald-400"
                          : "text-lg font-semibold text-rose-600 dark:text-rose-400"
                      }
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatMoney(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
            aria-labelledby="tx-modal-title"
            className="orvia-dialog max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-xl sm:max-h-[90vh] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="tx-modal-title"
                className="text-lg font-semibold text-foreground"
              >
                {t("finance.new")}
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
                  htmlFor="tx-type"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.type")}
                </label>
                <Select
                  id="tx-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as TransactionType,
                    }))
                  }
                  className="mt-1.5 w-full"
                >
                  <option value="income">{t("finance.income")}</option>
                  <option value="expense">{t("finance.expense")}</option>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="tx-category"
                  className="block text-sm font-medium text-muted"
                >
                  {t("finance.category")} <span className="text-red-400">*</span>
                </label>
                <Input
                  id="tx-category"
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="mt-1.5 w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="tx-amount"
                  className="block text-sm font-medium text-muted"
                >
                  {t("finance.amount")} <span className="text-red-400">*</span>
                </label>
                <Input
                  id="tx-amount"
                  required
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step="any"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="mt-1.5 w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="tx-currency"
                  className="block text-sm font-medium text-muted"
                >
                  {t("finance.currency")}
                </label>
                <Select
                  id="tx-currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as CurrencyCode,
                    }))
                  }
                  className="mt-1.5 w-full"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  htmlFor="tx-note"
                  className="block text-sm font-medium text-muted"
                >
                  {t("finance.note")}
                </label>
                <Textarea
                  id="tx-note"
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
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
