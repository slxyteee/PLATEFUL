export default function Loading() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6 animate-pulse flex flex-col gap-4">
      <div className="h-8 bg-muted rounded-lg w-40" />
      <div className="h-12 bg-muted rounded-xl" />
      <div className="h-64 bg-muted rounded-2xl" />
    </div>
  );
}
