'use client';

export function MovieCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-[2/3] rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] md:h-[85vh]">
      <div className="skeleton w-full h-full rounded-none" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-4">
        <div className="skeleton h-10 w-96 rounded" />
        <div className="skeleton h-4 w-64 rounded" />
        <div className="skeleton h-4 w-full max-w-xl rounded" />
        <div className="flex gap-3">
          <div className="skeleton h-12 w-32 rounded-lg" />
          <div className="skeleton h-12 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="skeleton w-full md:w-80 aspect-[2/3] rounded-xl" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-10 w-96 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-20 w-full rounded" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}
