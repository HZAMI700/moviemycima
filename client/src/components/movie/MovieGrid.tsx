'use client';

import MovieCard from './MovieCard';
import { MovieCardSkeleton } from '@/components/ui/Skeleton';
import type { Movie } from '@/types';

interface Props {
  items: Movie[];
  loading?: boolean;
  type?: 'movie' | 'series';
}

export default function MovieGrid({ items, loading, type = 'movie' }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-400 text-lg">لا توجد نتائج</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, i) => (
        <MovieCard key={item._id} item={item} type={type} index={i} />
      ))}
    </div>
  );
}
