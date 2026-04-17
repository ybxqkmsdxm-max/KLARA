import { Skeleton } from "@/components/ui/skeleton";

export default function FacturesLoading() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
