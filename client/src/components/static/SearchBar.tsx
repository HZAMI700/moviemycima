'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchCatalog } from '@/lib/staticData';
import type { StaticItem } from '@/lib/staticData';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StaticItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const items = await searchCatalog(q);
      setResults(items.slice(0, 10));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder="ابحث عن فيلم أو مسلسل..."
        className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 px-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
      />

      {showResults && (query.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-xl overflow-hidden shadow-2xl z-50">
          {loading && (
            <div className="p-4 text-center text-dark-400">جاري البحث...</div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-4 text-center text-dark-400">لا توجد نتائج</div>
          )}

          {results.map((item) => (
            <a
              key={item.id}
              href={item.page_url}
              className="flex items-center gap-3 p-3 hover:bg-dark-700 transition-colors"
            >
              {item.poster_image_url && (
                <img src={item.poster_image_url} alt="" className="w-10 h-14 rounded object-cover" />
              )}
              <div>
                <p className="text-sm font-medium">{item.titleAr || item.title}</p>
                <p className="text-xs text-dark-400">
                  {item.content_type === 'movie' ? 'فيلم' : 'مسلسل'} · {item.year || ''}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
