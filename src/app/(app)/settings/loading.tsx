export default function Loading() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6 animate-pulse flex flex-col gap-6">
      <div className="h-8 bg-muted rounded-lg w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-8 bg-muted rounded-full w-20" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
