'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import MovieCard from './MovieCard';
import type { Movie } from '@/types';

interface Props {
  title: string;
  titleAr: string;
  items: Movie[];
  href?: string;
  loading?: boolean;
}

export default function MovieRow({ title, titleAr, items, href, loading }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.8;
    rowRef.current.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section className="relative">
      <div className="container-custom mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{titleAr}</h2>
            <p className="text-dark-400 text-sm mt-0.5">{title}</p>
          </div>
          {href && (
            <Link href={href} className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-1">
              عرض الكل <HiChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="relative group">
        <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-dark-950 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <HiChevronRight className="w-6 h-6 text-white/80" />
        </button>
        <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-dark-950 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <HiChevronLeft className="w-6 h-6 text-white/80" />
        </button>

        <div ref={rowRef} className="overflow-x-auto scrollbar-none px-4 md:px-8" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-3 md:gap-4" style={{ minWidth: 'max-content' }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-[160px] md:w-[200px] space-y-3 flex-shrink-0">
                  <div className="skeleton aspect-[2/3] rounded-xl" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))
            ) : (
              items.map((item, i) => (
                <div key={item._id} className="w-[160px] md:w-[200px] flex-shrink-0">
                  <MovieCard item={item} index={i} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
