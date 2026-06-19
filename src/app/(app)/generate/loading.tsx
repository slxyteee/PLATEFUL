export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-8">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-48 mb-2" />
        <div className="h-4 bg-muted rounded w-72" />
      </div>
      <div className="animate-pulse bg-muted rounded-2xl h-64" />
      <div className="animate-pulse h-14 bg-muted rounded-2xl" />
    </div>
  );
}
