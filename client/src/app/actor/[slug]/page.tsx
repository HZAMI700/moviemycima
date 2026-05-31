'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import MovieGrid from '@/components/movie/MovieGrid';
import { actorsAPI } from '@/lib/api';
import type { Actor, Movie } from '@/types';

export default function ActorPage() {
  const { slug } = useParams();
  const [actor, setActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data: actorData } = await actorsAPI.getBySlug(slug as string);
        setActor(actorData);
        const { data } = await actorsAPI.getContent(actorData._id);
        setMovies(data.movies || []);
        setSeries(data.series || []);
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, [slug]);

  if (loading) return <div className="pt-24 text-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!actor) return <div className="pt-24 text-center text-dark-400">الممثل غير موجود</div>;

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-2xl p-6 md:p-8 mb-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 rounded-full bg-dark-700 overflow-hidden flex-shrink-0">
              {actor.image ? <img src={actor.image} alt={actor.nameAr} className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-dark-400">{actor.nameAr?.[0] || actor.name[0]}</div>
              )}
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-2xl md:text-3xl font-bold">{actor.nameAr || actor.name}</h1>
              <p className="text-dark-400 mt-1">{actor.name}</p>
              {actor.bioAr && <p className="text-dark-300 mt-4 leading-relaxed max-w-2xl">{actor.bioAr}</p>}
              {actor.nationality && <p className="text-dark-400 text-sm mt-2">الجنسية: {actor.nationality}</p>}
            </div>
          </div>
        </motion.div>

        {movies.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-6">الأفلام</h2>
            <MovieGrid items={movies} />
          </div>
        )}

        {series.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">المسلسلات</h2>
            <MovieGrid items={series} type="series" />
          </div>
        )}
      </div>
    </div>
  );
}
