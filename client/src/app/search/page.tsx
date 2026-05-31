'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiSearch } from 'react-icons/hi';
import MovieGrid from '@/components/movie/MovieGrid';
import { moviesAPI, genresAPI } from '@/lib/api';
import type { Movie, Genre } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ genre: '', year: '', rating: '' });

  useEffect(() => {
    genresAPI.getAll().then(({ data }) => setGenres(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query && !filters.genre && !filters.year && !filters.rating) return;
    const timer = setTimeout(() => performSearch(), 300);
    return () => clearTimeout(timer);
  }, [query, filters]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 30 };
      if (query) params.q = query;
      if (filters.genre) params.genre = filters.genre;
      if (filters.year) params.year = filters.year;
      if (filters.rating) params.rating = filters.rating;
      const { data } = await moviesAPI.search(params);
      setResults(data.movies || []);
    } catch {} finally { setLoading(false); }
  }, [query, filters]);

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative mb-8">
            <HiSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="ابحث عن فيلم أو مسلسل..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors text-lg"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <select value={filters.genre} onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))}
              className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
              <option value="">كل التصنيفات</option>
              {genres.map(g => <option key={g._id} value={g._id}>{g.nameAr || g.name}</option>)}
            </select>
            <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
              className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
              <option value="">كل السنوات</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))}
              className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
              <option value="">كل التقييمات</option>
              {[9,8,7,6,5].map(r => <option key={r} value={r}>{r}+ تقييم</option>)}
            </select>
          </div>

          {results.length > 0 && (
            <p className="text-dark-400 text-sm mb-4">{results.length} نتيجة</p>
          )}

          <MovieGrid items={results} loading={loading} />

          {!loading && results.length === 0 && (query || filters.genre || filters.year || filters.rating) && (
            <div className="text-center py-20">
              <p className="text-dark-400 text-lg">لا توجد نتائج للبحث</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
