import { localStorageAdapter } from "@/core/storage/local-storage-adapter";
import type {
  EntityRepository,
  LocalListRepositoryOptions,
  Repository,
} from "@/core/repositories/types";

function readValidItems<T>(options: LocalListRepositoryOptions<T>): T[] {
  const storedItems = localStorageAdapter.get<unknown[]>({
    key: options.key,
    fallback: [],
  });

  return Array.isArray(storedItems)
    ? storedItems.filter(options.validate)
    : [];
}

export function createLocalListRepository<T>(
  options: LocalListRepositoryOptions<T>,
): Repository<T> {
  return {
    list(): T[] {
      return readValidItems(options);
    },

    save(items: readonly T[]): void {
      localStorageAdapter.set({
        key: options.key,
        value: [...items],
      });
    },

    clear(): void {
      localStorageAdapter.remove(options.key);
    },
  };
}

export function createLocalEntityRepository<T extends { id: string }>(
  options: LocalListRepositoryOptions<T>,
): EntityRepository<T> {
  const listRepository = createLocalListRepository(options);

  return {
    ...listRepository,

    getById(id: string): T | undefined {
      return listRepository.list().find((item) => item.id === id);
    },

    upsert(item: T): T[] {
      const items = listRepository.list();
      const exists = items.some((existingItem) => existingItem.id === item.id);
      const nextItems = exists
        ? items.map((existingItem) =>
            existingItem.id === item.id ? item : existingItem,
          )
        : [item, ...items];

      listRepository.save(nextItems);

      return nextItems;
    },

    update(id: string, updateItem: (item: T) => T): T[] {
      const nextItems = listRepository
        .list()
        .map((item) => (item.id === id ? updateItem(item) : item));

      listRepository.save(nextItems);

      return nextItems;
    },

    remove(id: string): T[] {
      const nextItems = listRepository
        .list()
        .filter((item) => item.id !== id);

      listRepository.save(nextItems);

      return nextItems;
    },
  };
}
