'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiBookmark, HiClock, HiCog, HiLogout } from 'react-icons/hi';
import MovieGrid from '@/components/movie/MovieGrid';
import { useAuthStore } from '@/store/useAuthStore';
import { bookmarksAPI, historyAPI } from '@/lib/api';
import type { Movie } from '@/types';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'bookmarks' | 'history' | 'settings'>('bookmarks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [bookRes, histRes] = await Promise.all([
        bookmarksAPI.getAll(),
        historyAPI.get(),
      ]);
      setBookmarks(bookRes.data || []);
      setHistory(histRes.data || []);
    } catch {} finally { setLoading(false); }
  };

  if (!user) return null;

  const tabs = [
    { key: 'bookmarks', label: 'المفضلة', icon: HiBookmark },
    { key: 'history', label: 'سجل المشاهدة', icon: HiClock },
    { key: 'settings', label: 'الإعدادات', icon: HiCog },
  ] as const;

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold">{user.name[0]}</div>
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-dark-400 text-sm">{user.email}</p>
              <span className="text-xs text-primary-500 mt-1 inline-block">{user.role === 'admin' ? 'مدير' : 'مستخدم'}</span>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-8 bg-dark-800/50 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                tab === t.key ? 'bg-primary-600 text-white' : 'text-dark-300 hover:text-white'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'bookmarks' && (
          loading ? <div className="text-center text-dark-400 py-10">جاري التحميل...</div> :
          bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <HiBookmark className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-4">لا توجد عناصر في المفضلة</p>
              <Link href="/movies" className="btn-primary text-sm">تصفح الأفلام</Link>
            </div>
          ) : (
            <MovieGrid items={bookmarks.map((b: any) => b.item).filter(Boolean)} />
          )
        )}

        {tab === 'history' && (
          loading ? <div className="text-center text-dark-400 py-10">جاري التحميل...</div> :
          history.length === 0 ? (
            <div className="text-center py-16">
              <HiClock className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">لا يوجد سجل مشاهدة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item: any) => (
                <Link key={item._id} href={`/${item.itemType === 'Series' ? 'serie' : 'movie'}/${item.itemId?.slug}`}
                  className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700 transition-colors">
                  <img src={item.itemId?.poster} alt="" className="w-14 h-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-medium">{item.itemId?.titleAr || item.itemId?.title}</p>
                    <p className="text-dark-400 text-sm">{Math.round(item.progress)}% مكتمل</p>
                  </div>
                  <span className="text-xs text-dark-500">{new Date(item.lastWatched).toLocaleDateString('ar-SA')}</span>
                </Link>
              ))}
            </div>
          )
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <button onClick={() => { logout(); router.push('/'); }} className="flex items-center gap-3 w-full p-4 bg-dark-800/50 rounded-xl hover:bg-red-900/20 hover:text-red-400 transition-colors text-right">
              <HiLogout className="w-5 h-5" />
              <span>تسجيل خروج</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
