type EmptyStateProps = {
    title: string;
    description?: string;
  };
  
  export function EmptyState({
    title,
    description,
  }: EmptyStateProps) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {title}
        </h3>
  
        {description ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
    );
  }