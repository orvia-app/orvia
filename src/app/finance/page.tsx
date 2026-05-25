"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Wallet } from "lucide-react";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

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
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

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
      id: Date.now().toString(),
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
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/50 bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-300" aria-hidden />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                  Finance
                </h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                  Track income, expenses, and cashflow.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              + Add Transaction
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                Income total
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {formatMoney(incomeTotal)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                All currencies summed
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                Expense total
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
                {formatMoney(expenseTotal)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                All currencies summed
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                Cashflow
              </p>
              <p
                className={
                  cashflow >= 0
                    ? "mt-2 text-2xl font-semibold text-zinc-950 dark:text-white"
                    : "mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {formatMoney(cashflow)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
                Income − expenses
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Transactions
            </h2>
            {transactions.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 px-6 py-14 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-500">
                No transactions yet. Add income or expenses to see them here.
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {transactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-zinc-950 dark:text-white">
                        {t.category}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-500">
                        {new Date(t.createdAt).toLocaleString()} ·{" "}
                        {t.currency}
                      </p>
                      {t.note ? (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-4 dark:bg-black/70 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="tx-modal-title"
                className="text-lg font-semibold text-zinc-950 dark:text-white"
              >
                New transaction
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
                  htmlFor="tx-type"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Type
                </label>
                <select
                  id="tx-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as TransactionType,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  <option value="income">income</option>
                  <option value="expense">expense</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="tx-category"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Category <span className="text-red-400">*</span>
                </label>
                <input
                  id="tx-category"
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label
                  htmlFor="tx-amount"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Amount <span className="text-red-400">*</span>
                </label>
                <input
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
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label
                  htmlFor="tx-currency"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Currency
                </label>
                <select
                  id="tx-currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as CurrencyCode,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="tx-note"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Note
                </label>
                <textarea
                  id="tx-note"
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
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
