import { Children, type ReactNode } from "react";

export interface KanbanColumn {
  id: string;
  title: string;
  items: ReactNode;
  badgeClassName?: string;
  count?: number;
}

interface KanbanProps {
  columns: KanbanColumn[];
  className?: string;
  emptyLabel?: string;
}

export default function Kanban({
  columns,
  className = "",
  emptyLabel = "Aucune tâche",
}: KanbanProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {columns.map((column) => {
        const count = column.count ?? Children.count(column.items);
        return (
          <section
            key={column.id}
            className="flex min-h-52 flex-col rounded-xl border border-secondary bg-base p-3"
          >
            <header className="mb-3 flex items-center justify-between gap-3 border-b border-secondary pb-3">
              <span
                className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${column.badgeClassName ?? "bg-primary/10 text-primary"}`}
              >
                <span className="truncate">{column.title}</span>
              </span>
              <span className="shrink-0 rounded-full bg-light px-2 py-0.5 text-xs font-semibold text-foreground/70">
                {count}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-3">
              {count === 0 ? (
                <p className="rounded-lg border border-dashed border-secondary px-3 py-4 text-center text-xs text-foreground/60">
                  {emptyLabel}
                </p>
              ) : (
                column.items
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
