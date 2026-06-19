export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse flex flex-col gap-4">
      <div className="h-8 bg-muted rounded-lg w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
