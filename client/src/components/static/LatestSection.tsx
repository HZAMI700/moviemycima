'use client';

import { useState, useEffect } from 'react';
import { loadLatest } from '@/lib/staticData';
import type { StaticItem } from '@/lib/staticData';

interface Props {
  limit?: number;
}

export default function LatestSection({ limit = 10 }: Props) {
  const [items, setItems] = useState<StaticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLatest()
      .then((data) => setItems(data.items.slice(0, limit)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">أحدث الإضافات</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 bg-dark-800 rounded-xl aspect-[2/3] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">أحدث الإضافات</h2>
        <p className="text-red-400">فشل تحميل البيانات: {error}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">أحدث الإضافات</h2>
        <p className="text-dark-400">لا توجد إضافات حديثة</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">أحدث الإضافات</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.page_url}
            className="flex-shrink-0 w-36 group bg-dark-800 rounded-xl overflow-hidden hover:ring-2 ring-primary-500 transition-all"
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
              <p className="text-xs font-medium truncate">{item.titleAr || item.title}</p>
              <span className="text-[10px] text-dark-400">{item.content_type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
