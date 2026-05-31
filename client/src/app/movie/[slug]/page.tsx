'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiPlay, HiStar, HiCalendar, HiClock, HiEye, HiBookmark, HiBookmarkAlt } from 'react-icons/hi';
import MovieGrid from '@/components/movie/MovieGrid';
import CommentSection from '@/components/ui/CommentSection';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { moviesAPI, bookmarksAPI } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { Movie } from '@/types';
import toast from 'react-hot-toast';

export default function MovieDetailPage() {
  const { slug } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [related, setRelated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await moviesAPI.getMovieBySlug(slug as string);
        setMovie(data);
        const { data: relatedData } = await moviesAPI.getRelated(data._id);
        setRelated(relatedData || []);
        if (user) {
          const has = user.bookmarks?.some((b: any) => b.item?._id === data._id || b.item === data._id);
          setIsBookmarked(!!has);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [slug, user]);

  const toggleBookmark = async () => {
    if (!user) return toast.error('سجل الدخول أولاً');
    try {
      if (isBookmarked) {
        await bookmarksAPI.remove({ itemId: movie!._id, itemType: 'Movie' });
        toast.success('تم الإزالة من المفضلة');
      } else {
        await bookmarksAPI.add({ itemId: movie!._id, itemType: 'Movie' });
        toast.success('تمت الإضافة للمفضلة');
      }
      setIsBookmarked(!isBookmarked);
    } catch { toast.error('حدث خطأ'); }
  };

  if (loading) return <div className="pt-20"><DetailSkeleton /></div>;
  if (!movie) return <div className="pt-20 text-center text-dark-400">الفيلم غير موجود</div>;

  const title = movie.titleAr || movie.title;
  const desc = movie.descriptionAr || movie.description;

  return (
    <div className="pt-20">
      <div className="relative h-[50vh] md:h-[65vh]">
        <img src={movie.poster || movie.thumbnail} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />
      </div>

      <div className="container-custom -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-72 flex-shrink-0">
            <img src={movie.poster} alt={title} className="w-full rounded-2xl shadow-2xl shadow-black/50" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 pt-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-dark-400 text-lg mb-4">{movie.title}</p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {movie.rating > 0 && <span className="flex items-center gap-1.5 text-yellow-400"><HiStar className="w-5 h-5" />{movie.rating}</span>}
              {movie.year && <span className="flex items-center gap-1.5 text-dark-300"><HiCalendar className="w-5 h-5" />{movie.year}</span>}
              {movie.duration && <span className="flex items-center gap-1.5 text-dark-300"><HiClock className="w-5 h-5" />{movie.duration}</span>}
              <span className="flex items-center gap-1.5 text-dark-300"><HiEye className="w-5 h-5" />{movie.views?.toLocaleString() || 0}</span>
              {movie.quality && <span className="bg-primary-600/20 text-primary-500 px-3 py-1 rounded-full text-sm font-medium">{movie.quality}</span>}
            </div>

            <div className="flex items-center gap-3 mb-8">
              <Link href={`/watch/${movie.slug}`} className="btn-primary flex items-center gap-2 !py-3 !px-8 text-base">
                <HiPlay className="w-5 h-5" /> مشاهدة الآن
              </Link>
              <button onClick={toggleBookmark} className="btn-outline flex items-center gap-2 !py-3 !px-4">
                {isBookmarked ? <HiBookmark className="w-5 h-5 text-primary-500" /> : <HiBookmarkAlt className="w-5 h-5" />}
              </button>
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map(g => (
                  <Link key={g._id} href={`/genre/${g.slug}`} className="text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 px-4 py-1.5 rounded-full transition-colors">
                    {g.nameAr || g.name}
                  </Link>
                ))}
              </div>
            )}

            {desc && (
              <div className="mb-8">
                <h3 className="font-bold mb-2 text-lg">القصة</h3>
                <p className="text-dark-300 leading-relaxed">{desc}</p>
              </div>
            )}

            {movie.actors && movie.actors.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold mb-4 text-lg">الممثلون</h3>
                <div className="flex flex-wrap gap-4">
                  {movie.actors.map(a => (
                    <Link key={a._id} href={`/actor/${a.slug}`} className="text-center group">
                      <div className="w-16 h-16 rounded-full bg-dark-700 overflow-hidden mb-1.5 mx-auto">
                        {a.image ? <img src={a.image} alt={a.nameAr} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-dark-400">{a.nameAr?.[0] || a.name[0]}</div>}
                      </div>
                      <p className="text-xs text-dark-300 group-hover:text-white transition-colors">{a.nameAr || a.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {movie.embedLinks && movie.embedLinks.length > 0 && (
          <div className="mt-10">
            <h3 className="font-bold text-lg mb-4">روابط المشاهدة</h3>
            <div className="flex flex-wrap gap-2">
              {movie.embedLinks.map((link, i) => (
                <Link key={i} href={`/watch/${movie.slug}?server=${i}`} className="bg-dark-800 hover:bg-dark-700 text-sm px-4 py-2 rounded-lg transition-colors">
                  سيرفر {i + 1}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <CommentSection itemId={movie._id} itemType="Movie" />
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">أفلام مشابهة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.map((item, i) => (
                <Link key={item._id} href={`/movie/${item.slug}`}>
                  <img src={item.poster} alt={item.titleAr} className="w-full aspect-[2/3] object-cover rounded-xl" />
                  <p className="text-sm mt-1 truncate">{item.titleAr}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
