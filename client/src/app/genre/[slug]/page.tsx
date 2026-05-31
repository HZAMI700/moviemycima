'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MovieGrid from '@/components/movie/MovieGrid';
import { moviesAPI, genresAPI } from '@/lib/api';
import type { Movie, Genre } from '@/types';

export default function GenrePage() {
  const { slug } = useParams();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data: genreData } = await genresAPI.getBySlug(slug as string);
        setGenre(genreData);
        const { data } = await moviesAPI.getMovies({ genre: genreData._id, limit: 30 });
        setMovies(data.movies || []);
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, [slug]);

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">{genre?.nameAr || genre?.name || '...'}</h1>
          <p className="text-dark-400 mb-8">{genre?.description}</p>
        </motion.div>
        <MovieGrid items={movies} loading={loading} />
      </div>
    </div>
  );
}
