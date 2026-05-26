export type ItemValidator<T> = (value: unknown) => value is T;

export interface Repository<T> {
  list(): T[];
  save(items: readonly T[]): void;
  clear(): void;
}

export interface EntityRepository<T extends { id: string }>
  extends Repository<T> {
  getById(id: string): T | undefined;
  upsert(item: T): T[];
  update(id: string, updateItem: (item: T) => T): T[];
  remove(id: string): T[];
}

export type LocalListRepositoryOptions<T> = {
  key: string;
  validate: ItemValidator<T>;
};
