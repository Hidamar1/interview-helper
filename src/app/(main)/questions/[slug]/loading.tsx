export default function QuestionLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex animate-pulse gap-2">
        <div className="h-6 w-16 rounded-full bg-cream" />
        <div className="h-6 w-16 rounded-full bg-cream" />
        <div className="h-6 w-16 rounded-full bg-cream" />
      </div>
      <div className="mt-4 mb-6 h-8 w-3/4 rounded bg-cream" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-cream" />
        <div className="h-4 w-5/6 rounded bg-cream" />
        <div className="h-4 w-4/6 rounded bg-cream" />
        <div className="h-4 w-full rounded bg-cream" />
        <div className="h-4 w-3/4 rounded bg-cream" />
      </div>
    </div>
  );
}
