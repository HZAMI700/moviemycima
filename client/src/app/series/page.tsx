'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MovieGrid from '@/components/movie/MovieGrid';
import { seriesAPI, genresAPI } from '@/lib/api';
import type { Genre } from '@/types';

export default function SeriesPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('');

  useEffect(() => {
    genresAPI.getAll().then(({ data }) => setGenres(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    seriesAPI.getSeries({ page, limit: 24, genre: selectedGenre || undefined })
      .then(({ data }) => {
        setSeries(data.series || []);
        setTotalPages(data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, selectedGenre]);

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">المسلسلات</h1>
          <p className="text-dark-400 mb-6">جميع المسلسلات المتاحة على المنصة</p>
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

        <MovieGrid items={series} loading={loading} type="series" />

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
