'use client';

import { useState, useEffect } from 'react';
import { loadSeries } from '@/lib/staticData';
import type { StaticItem } from '@/lib/staticData';

interface Props {
  limit?: number;
}

export default function StaticSeriesGrid({ limit = 24 }: Props) {
  const [items, setItems] = useState<StaticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    loadSeries()
      .then((data) => setItems(data.items.slice(0, limit)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-dark-800 rounded-xl aspect-[2/3] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-400">فشل تحميل البيانات: {error}</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-10 text-dark-400">لا توجد مسلسلات متاحة حالياً</div>;
  }

  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {pageItems.map((item) => (
          <a
            key={item.id}
            href={item.page_url}
            className="group bg-dark-800 rounded-xl overflow-hidden hover:ring-2 ring-primary-500 transition-all"
          >
            {item.poster_image_url ? (
              <img
                src={item.poster_image_url}
                alt={item.titleAr || item.title || ''}
                className="w-full aspect-[2/3] object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-dark-700 flex items-center justify-center text-dark-400">
                ?
              </div>
            )}
            <div className="p-2">
              <h3 className="text-sm font-medium truncate">{item.titleAr || item.title}</h3>
              <p className="text-xs text-dark-400">{item.year || ''}</p>
            </div>
          </a>
        ))}
      </div>

      {items.length > perPage && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(items.length / perPage) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded text-sm ${
                page === i + 1 ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
