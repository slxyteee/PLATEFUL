export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse flex flex-col gap-4">
      <div className="h-8 bg-muted rounded-lg w-48" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded-2xl" />
      ))}
    </div>
  );
}
