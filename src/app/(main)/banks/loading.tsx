export default function BanksLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-8 w-24 animate-pulse rounded-full bg-cream" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-card border border-border-warm bg-white p-5">
            <div className="mb-3 size-9 rounded-[10px] bg-cream" />
            <div className="mb-2 h-4 w-3/4 rounded bg-cream" />
            <div className="mb-1 h-3 w-full rounded bg-cream" />
            <div className="h-3 w-1/2 rounded bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}
