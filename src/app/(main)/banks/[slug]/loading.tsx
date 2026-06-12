export default function BankDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex animate-pulse items-center gap-4">
        <div className="size-14 rounded-card bg-cream" />
        <div className="flex-1">
          <div className="mb-2 h-5 w-48 rounded bg-cream" />
          <div className="h-4 w-full rounded bg-cream" />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-16 rounded-full bg-cream" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-card bg-cream" />
        ))}
      </div>
    </div>
  );
}
