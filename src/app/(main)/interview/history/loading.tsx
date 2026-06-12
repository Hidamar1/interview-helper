export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 h-6 w-24 animate-pulse rounded bg-cream" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-card bg-cream" />
        ))}
      </div>
    </div>
  );
}
