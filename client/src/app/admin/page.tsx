'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiFilm, HiCollection, HiUser, HiChat, HiEye, HiTrendingUp } from 'react-icons/hi';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI } from '@/lib/api';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [dashRes, analyticRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics(),
      ]);
      setDashboard(dashRes.data);
      setAnalytics(analyticRes.data);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <div className="pt-24 text-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  const stats = dashboard?.stats || {};

  const statCards = [
    { label: 'أفلام', value: stats.totalMovies || 0, icon: HiFilm, color: 'from-blue-500 to-blue-600' },
    { label: 'مسلسلات', value: stats.totalSeries || 0, icon: HiCollection, color: 'from-purple-500 to-purple-600' },
    { label: 'مستخدمين', value: stats.totalUsers || 0, icon: HiUser, color: 'from-green-500 to-green-600' },
    { label: 'تعليقات', value: stats.totalComments || 0, icon: HiChat, color: 'from-pink-500 to-pink-600' },
  ];

  return (
    <div className="pt-24 pb-10">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
          <p className="text-dark-400 mb-8">مرحباً بك في لوحة إدارة المنصة</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {statCards.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-effect rounded-2xl p-5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-dark-400 text-sm">{card.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-4">أحدث الأفلام</h2>
              <div className="space-y-3">
                {dashboard?.recentMovies?.map((m: any) => (
                  <div key={m._id} className="flex items-center justify-between py-2 border-b border-dark-700/50 last:border-0">
                    <span className="text-sm truncate ml-4">{m.titleAr || m.title}</span>
                    <div className="flex items-center gap-3 text-xs text-dark-400 flex-shrink-0">
                      <span>⭐ {m.rating}</span>
                      <span className="flex items-center gap-1"><HiEye className="w-3.5 h-3.5" />{m.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-4">أحدث المستخدمين</h2>
              <div className="space-y-3">
                {dashboard?.recentUsers?.map((u: any) => (
                  <div key={u._id} className="flex items-center justify-between py-2 border-b border-dark-700/50 last:border-0">
                    <span className="text-sm">{u.name}</span>
                    <span className="text-xs text-dark-500">{new Date(u.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {analytics?.genreDistribution && (
            <div className="glass-effect rounded-2xl p-6 mt-6">
              <h2 className="font-bold text-lg mb-4">توزيع الأفلام حسب التصنيف</h2>
              <div className="space-y-3">
                {analytics.genreDistribution.slice(0, 10).map((g: any) => (
                  <div key={g._id} className="flex items-center gap-3">
                    <span className="text-sm w-24 truncate">{g.nameAr || g.name}</span>
                    <div className="flex-1 h-2.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((g.count / Math.max(...analytics.genreDistribution.map((x: any) => x.count))) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-dark-400 w-8 text-left">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
