'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiSearch, HiBookmark, HiUser, HiChevronDown, HiFilm, HiCollection } from 'react-icons/hi';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { moviesAPI } from '@/lib/api';
import type { Movie } from '@/types';

const navLinks = [
  { href: '/', label: 'الرئيسية', icon: HiFilm },
  { href: '/movies', label: 'أفلام', icon: HiFilm },
  { href: '/series', label: 'مسلسلات', icon: HiCollection },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchLocal, setSearchLocal] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setSearchLocal(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const { data } = await moviesAPI.search({ q, limit: 5 });
      setResults(data.movies || []);
    } catch { setResults([]); }
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-950/95 backdrop-blur-xl shadow-lg shadow-black/20' : 'bg-transparent'
    }`}>
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl md:text-3xl font-bold gradient-text">MovieMyCima</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-1.5 px-4 py-2 text-dark-300 hover:text-white rounded-lg hover:bg-dark-800/50 transition-all duration-200 text-sm font-medium">
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2.5 rounded-lg hover:bg-dark-800/50 transition-colors">
              <HiSearch className="w-5 h-5 text-dark-300" />
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/profile" className="p-2.5 rounded-lg hover:bg-dark-800/50 transition-colors">
                  <HiBookmark className="w-5 h-5 text-dark-300" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
                      {user.name[0]}
                    </div>
                    <HiChevronDown className="w-4 h-4 text-dark-400" />
                  </button>
                  <div className="absolute left-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link href="/profile" className="block px-4 py-3 hover:bg-dark-700 rounded-t-xl text-sm">الملف الشخصي</Link>
                    {user.role === 'admin' && <Link href="/admin" className="block px-4 py-3 hover:bg-dark-700 text-sm">لوحة التحكم</Link>}
                    <button onClick={logout} className="block w-full text-right px-4 py-3 hover:bg-dark-700 rounded-b-xl text-sm text-red-400">تسجيل خروج</button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/auth" className="hidden md:flex btn-primary text-sm !py-2 !px-4">تسجيل الدخول</Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 rounded-lg hover:bg-dark-800/50 transition-colors">
              {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border-t border-dark-800 bg-dark-900/95 backdrop-blur-xl">
            <div className="container-custom py-4">
              <div className="relative">
                <HiSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={searchLocal}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="ابحث عن فيلم أو مسلسل..."
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pr-12 pl-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  autoFocus
                />
              </div>
              {results.length > 0 && (
                <div className="mt-3 space-y-2">
                  {results.map((movie) => (
                    <Link key={movie._id} href={`/movie/${movie.slug}`} onClick={() => setShowSearch(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors">
                      <img src={movie.poster || '/placeholder.jpg'} alt="" className="w-10 h-14 rounded object-cover" />
                      <div>
                        <p className="font-medium text-sm">{movie.titleAr}</p>
                        <p className="text-dark-400 text-xs">{movie.year} • ⭐ {movie.rating}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-dark-800 bg-dark-900/95 backdrop-blur-xl overflow-hidden">
            <div className="container-custom py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-dark-700/50 transition-colors">
                  <link.icon className="w-5 h-5 text-primary-500" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <hr className="border-dark-700 my-2" />
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-dark-700/50 transition-colors">
                    <HiUser className="w-5 h-5 text-primary-500" />
                    <span>الملف الشخصي</span>
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-dark-700/50 transition-colors w-full text-right text-red-400">تسجيل خروج</button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setMobileOpen(false)} className="btn-primary block text-center">تسجيل الدخول</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
