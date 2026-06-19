export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse flex flex-col gap-4">
      <div className="h-8 bg-muted rounded-lg w-32" />
      <div className="h-12 bg-muted rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
