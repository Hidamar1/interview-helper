export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex animate-pulse items-center gap-4">
        <div className="size-16 rounded-full bg-cream" />
        <div className="flex-1">
          <div className="mb-2 h-5 w-32 rounded bg-cream" />
          <div className="mb-1 h-4 w-48 rounded bg-cream" />
          <div className="h-4 w-24 rounded bg-cream" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-6 w-32 rounded bg-cream" />
        <div className="h-48 w-full animate-pulse rounded-xl bg-cream" />
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-6 w-24 rounded bg-cream" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-lg bg-cream" />
        ))}
      </div>
    </div>
  );
}
