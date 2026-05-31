'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiPlay, HiStar, HiClock } from 'react-icons/hi';
import type { Movie } from '@/types';

interface Props {
  item: Movie;
  type?: 'movie' | 'series';
  index?: number;
}

export default function MovieCard({ item, type = 'movie', index = 0 }: Props) {
  const href = type === 'movie' ? `/movie/${item.slug}` : `/serie/${(item as any).slug}`;
  const title = item.titleAr || item.title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={href} className="group block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-dark-800">
          <img
            src={item.poster || '/placeholder.jpg'}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
            <div className="w-16 h-16 rounded-full bg-primary-600/90 flex items-center justify-center backdrop-blur-sm">
              <HiPlay className="w-7 h-7 text-white ml-0.5" />
            </div>
          </div>
          {item.quality && (
            <span className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-md font-medium">
              {item.quality}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-3 text-xs text-white/80">
              {item.rating > 0 && (
                <span className="flex items-center gap-1">
                  <HiStar className="w-3.5 h-3.5 text-yellow-400" />
                  {item.rating}
                </span>
              )}
              {item.year && <span>{item.year}</span>}
              {item.duration && (
                <span className="flex items-center gap-1">
                  <HiClock className="w-3.5 h-3.5" />
                  {item.duration}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          {item.genres && item.genres.length > 0 && (
            <p className="text-xs text-dark-400 truncate mt-0.5">
              {item.genres.map(g => g.nameAr || g.name).join(' • ')}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
