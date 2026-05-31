'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlay, HiInformationCircle, HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import type { Movie } from '@/types';

interface Props {
  items: Movie[];
  loading?: boolean;
}

export default function HeroSlider({ items, loading }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => goTo((current + 1) % items.length), [current, items.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + items.length) % items.length), [current, items.length, goTo]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (loading || items.length === 0) {
    return (
      <div className="relative h-[70vh] md:h-[85vh] bg-dark-900">
        <div className="skeleton w-full h-full rounded-none" />
      </div>
    );
  }

  const movie = items[current];

  return (
    <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={movie.poster || movie.thumbnail}
            alt={movie.titleAr}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 gradient-overlay" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-end">
        <div className="container-custom pb-16 md:pb-24 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                {movie.rating > 0 && (
                  <span className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                    <span>⭐</span> {movie.rating}
                  </span>
                )}
                {movie.year && (
                  <span className="bg-dark-700/60 text-dark-200 px-3 py-1 rounded-full text-sm">{movie.year}</span>
                )}
                {movie.quality && (
                  <span className="bg-primary-600/80 text-white px-3 py-1 rounded-full text-sm">{movie.quality}</span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 text-white">
                {movie.titleAr || movie.title}
              </h1>

              <p className="text-sm md:text-base text-dark-200/80 mb-4 line-clamp-2 leading-relaxed max-w-xl">
                {movie.description || movie.descriptionAr}
              </p>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.slice(0, 4).map((genre) => (
                    <Link key={genre._id} href={`/genre/${genre.slug}`} className="text-xs bg-dark-700/60 hover:bg-dark-600/60 text-dark-200 px-3 py-1.5 rounded-full transition-colors">
                      {genre.nameAr || genre.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Link href={`/movie/${movie.slug}`} className="btn-primary flex items-center gap-2 text-base !py-3 !px-7">
                  <HiPlay className="w-5 h-5" /> مشاهدة الآن
                </Link>
                <Link href={`/movie/${movie.slug}`} className="btn-outline flex items-center gap-2 text-base !py-3 !px-5">
                  <HiInformationCircle className="w-5 h-5" /> تفاصيل
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all opacity-0 hover:opacity-100">
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all opacity-0 hover:opacity-100">
            <HiChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {items.slice(0, 6).map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary-500' : 'bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
