'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HeroSlider from '@/components/movie/HeroSlider';
import MovieRow from '@/components/movie/MovieRow';
import { moviesAPI, seriesAPI } from '@/lib/api';
import type { Movie } from '@/types';

export default function HomePage() {
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [latest, setLatest] = useState<Movie[]>([]);
  const [latestSeries, setLatestSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, trendingRes, latestRes, seriesRes] = await Promise.all([
          moviesAPI.getFeatured(),
          moviesAPI.getTrending(),
          moviesAPI.getLatest(),
          seriesAPI.getLatest(),
        ]);
        setFeatured(featuredRes.data || []);
        setTrending(trendingRes.data?.movies || trendingRes.data || []);
        setLatest(latestRes.data?.movies || latestRes.data || []);
        setLatestSeries(seriesRes.data?.series || seriesRes.data || []);
      } catch (err) {
        console.error('Failed to fetch home data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="pb-10">
      <HeroSlider items={featured} loading={loading} />

      <div className="-mt-20 relative z-10 space-y-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <MovieRow
            title="الأكثر مشاهدة"
            titleAr="ترند"
            items={trending}
            href="/movies?sort=-views"
            loading={loading}
          />
        </motion.div>

        <MovieRow
          title="أحدث الأفلام"
          titleAr="أفلام جديدة"
          items={latest}
          href="/movies"
          loading={loading}
        />

        <MovieRow
          title="أحدث المسلسلات"
          titleAr="مسلسلات جديدة"
          items={latestSeries}
          href="/series"
          loading={loading}
        />
      </div>
    </div>
  );
}
