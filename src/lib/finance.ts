import { safeReadStorage, safeWriteStorage, STORAGE_KEYS } from "@/lib/storage";

export type TransactionType = "income" | "expense";

export type CurrencyCode = "UAH" | "USD" | "EUR";

export type Transaction = {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: CurrencyCode;
  note: string;
  createdAt: string;
};

export const CURRENCIES: readonly CurrencyCode[] = ["UAH", "USD", "EUR"];

export function isTransactionType(value: unknown): value is TransactionType {
  return value === "income" || value === "expense";
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return (
    typeof value === "string" &&
    (CURRENCIES as readonly string[]).includes(value)
  );
}

export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const transaction = value as Partial<Transaction>;

  return (
    typeof transaction.id === "string" &&
    isTransactionType(transaction.type) &&
    typeof transaction.category === "string" &&
    transaction.category.trim().length > 0 &&
    typeof transaction.amount === "number" &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0 &&
    isCurrencyCode(transaction.currency) &&
    typeof transaction.note === "string" &&
    typeof transaction.createdAt === "string"
  );
}

export function getTransactions(): Transaction[] {
  const storedTransactions = safeReadStorage<unknown[]>(
    STORAGE_KEYS.financeTransactions,
    [],
  );

  return Array.isArray(storedTransactions)
    ? storedTransactions.filter(isTransaction)
    : [];
}

export function saveTransactions(transactions: Transaction[]): void {
  safeWriteStorage(STORAGE_KEYS.financeTransactions, transactions);
}

export function createTransaction(transaction: Transaction): Transaction[] {
  const transactions = getTransactions();
  const nextTransactions = [transaction, ...transactions];

  saveTransactions(nextTransactions);

  return nextTransactions;
}
