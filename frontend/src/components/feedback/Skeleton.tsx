type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-7 w-16 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-3 animate-pulse rounded bg-slate-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <div key={columnIndex} className="h-4 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-5 w-32 rounded bg-slate-200" />
      <div className="flex min-h-32 items-center gap-4 rounded-lg bg-slate-800 p-6">
        <div className="h-14 w-14 rounded-lg bg-slate-700" />
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-slate-700" />
          <div className="h-7 w-56 rounded bg-slate-700" />
          <div className="h-4 w-32 rounded bg-slate-700" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-6 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <TableSkeleton columns={7} rows={5} />
    </div>
  );
}
