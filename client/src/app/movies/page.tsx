'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MovieGrid from '@/components/movie/MovieGrid';
import { moviesAPI, genresAPI } from '@/lib/api';
import type { Movie, Genre } from '@/types';

function MoviesContent() {
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');

  useEffect(() => {
    genresAPI.getAll().then(({ data }) => setGenres(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    moviesAPI.getMovies({ page, limit: 24, genre: selectedGenre || undefined, sort })
      .then(({ data }) => {
        setMovies(data.movies || []);
        setTotalPages(data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, selectedGenre, sort]);

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">الأفلام</h1>
          <p className="text-dark-400 mb-6">جميع الأفلام المتاحة على المنصة</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => { setSelectedGenre(''); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedGenre ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}>الكل</button>
          {genres.map(g => (
            <button key={g._id} onClick={() => { setSelectedGenre(g._id); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === g._id ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}>{g.nameAr || g.name}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-dark-400 text-sm">ترتيب:</span>
          {[
            { value: '-createdAt', label: 'الأحدث' },
            { value: '-rating', label: 'الأعلى تقييماً' },
            { value: '-views', label: 'الأكثر مشاهدة' },
            { value: '-year', label: 'الأحدث إصداراً' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === opt.value ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
              }`}>{opt.label}</button>
          ))}
        </div>

        <MovieGrid items={movies} loading={loading} />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  page === i + 1 ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <MoviesContent />
    </Suspense>
  );
}
