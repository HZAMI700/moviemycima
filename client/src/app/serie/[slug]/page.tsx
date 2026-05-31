'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiPlay, HiStar, HiCalendar, HiEye, HiChevronDown } from 'react-icons/hi';
import CommentSection from '@/components/ui/CommentSection';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { seriesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SerieDetailPage() {
  const { slug } = useParams();
  const [serie, setSerie] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await seriesAPI.getSeriesBySlug(slug as string);
        setSerie(data);
        setEpisodes(data.episodes || []);
      } catch {
        toast.error('فشل تحميل المسلسل');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [slug]);

  if (loading) return <div className="pt-20"><DetailSkeleton /></div>;
  if (!serie) return <div className="pt-20 text-center text-dark-400">المسلسل غير موجود</div>;

  const title = serie.titleAr || serie.title;
  const seasons = [...new Set(episodes.map((e: any) => e.season))].sort();
  const filteredEpisodes = episodes.filter((e: any) => e.season === selectedSeason);

  return (
    <div className="pt-20">
      <div className="relative h-[50vh] md:h-[65vh]">
        <img src={serie.poster} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />
      </div>

      <div className="container-custom -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-72 flex-shrink-0">
            <img src={serie.poster} alt={title} className="w-full rounded-2xl shadow-2xl shadow-black/50" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 pt-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-dark-400 text-lg mb-4">{serie.title}</p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {serie.rating > 0 && <span className="flex items-center gap-1.5 text-yellow-400"><HiStar className="w-5 h-5" />{serie.rating}</span>}
              {serie.year && <span className="flex items-center gap-1.5 text-dark-300"><HiCalendar className="w-5 h-5" />{serie.year}</span>}
              <span className="flex items-center gap-1.5 text-dark-300"><HiEye className="w-5 h-5" />{serie.views?.toLocaleString() || 0}</span>
              <span className="bg-dark-800 text-dark-300 px-3 py-1 rounded-full text-sm">{serie.seasons} مواسم</span>
              <span className={`text-sm px-3 py-1 rounded-full ${serie.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-300'}`}>
                {serie.status === 'ongoing' ? 'مستمر' : 'منتهي'}
              </span>
            </div>

            {serie.genres && serie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {serie.genres.map((g: any) => (
                  <Link key={g._id} href={`/genre/${g.slug}`} className="text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 px-4 py-1.5 rounded-full transition-colors">
                    {g.nameAr || g.name}
                  </Link>
                ))}
              </div>
            )}

            {(serie.descriptionAr || serie.description) && (
              <div className="mb-8">
                <h3 className="font-bold mb-2 text-lg">القصة</h3>
                <p className="text-dark-300 leading-relaxed">{serie.descriptionAr || serie.description}</p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">الحلقات</h2>
          {seasons.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {seasons.map(s => (
                <button key={s} onClick={() => setSelectedSeason(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSeason === s ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}>الموسم {s}</button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredEpisodes.map((ep: any) => (
              <Link key={ep._id} href={`/watch/${serie.slug}?season=${ep.season}&episode=${ep.episode}`}
                className="flex items-center gap-3 p-3 bg-dark-800/50 hover:bg-dark-700 rounded-xl transition-colors group">
                <div className="w-24 h-14 rounded-lg bg-dark-700 flex-shrink-0 overflow-hidden">
                  {ep.thumbnail ? <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary-400 transition-colors">
                    {ep.titleAr || ep.title || `الحلقة ${ep.episode}`}
                  </p>
                  <p className="text-xs text-dark-400">الحلقة {ep.episode}</p>
                </div>
                <HiPlay className="w-5 h-5 text-dark-400 group-hover:text-primary-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <CommentSection itemId={serie._id} itemType="Series" />
        </div>
      </div>
    </div>
  );
}
