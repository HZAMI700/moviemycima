const genres = [
  { _id: 'g1', name: 'Action', nameAr: 'أكشن', slug: 'action', image: '' },
  { _id: 'g2', name: 'Comedy', nameAr: 'كوميدي', slug: 'comedy', image: '' },
  { _id: 'g3', name: 'Drama', nameAr: 'دراما', slug: 'drama', image: '' },
  { _id: 'g4', name: 'Horror', nameAr: 'رعب', slug: 'horror', image: '' },
  { _id: 'g5', name: 'Romance', nameAr: 'رومانسي', slug: 'romance', image: '' },
  { _id: 'g6', name: 'Sci-Fi', nameAr: 'خيال علمي', slug: 'sci-fi', image: '' },
  { _id: 'g7', name: 'Thriller', nameAr: 'إثارة', slug: 'thriller', image: '' },
  { _id: 'g8', name: 'Adventure', nameAr: 'مغامرة', slug: 'adventure', image: '' },
  { _id: 'g9', name: 'Animation', nameAr: 'أنيميشن', slug: 'animation', image: '' },
  { _id: 'g10', name: 'Crime', nameAr: 'جريمة', slug: 'crime', image: '' },
];

const actors = [
  { _id: 'a1', name: 'Ahmed Helmy', nameAr: 'أحمد حلمي', slug: 'ahmed-helmy', image: '', bioAr: 'ممثل كوميدي مصري' },
  { _id: 'a2', name: 'Karim Abdel Aziz', nameAr: 'كريم عبد العزيز', slug: 'karim-abdel-aziz', image: '', bioAr: 'ممثل مصري' },
  { _id: 'a3', name: 'Mona Zaki', nameAr: 'منى زكي', slug: 'mona-zaki', image: '', bioAr: 'ممثلة مصرية' },
  { _id: 'a4', name: 'Yousra', nameAr: 'يسرا', slug: 'yousra', image: '', bioAr: 'ممثلة مصرية' },
  { _id: 'a5', name: 'Mohamed Mamdouh', nameAr: 'محمد ممدوح', slug: 'mohamed-mamdouh', image: '', bioAr: 'ممثل مصري' },
];

const posters = [
  'https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
  'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
  'https://image.tmdb.org/t/p/w500/aLZtUUEMoD0JQ4dERabQVGxqFaB.jpg',
  'https://image.tmdb.org/t/p/w500/3bh3L4qLyrIe2D0ExJ3YpYJDmNl.jpg',
  'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
  'https://image.tmdb.org/t/p/w500/tumQwVnPKQ3Q4bP7v5eJ3VTLfW.jpg',
  'https://image.tmdb.org/t/p/w500/gpbqYQEb1toRUwCRmZqHSJwa5NY.jpg',
  'https://image.tmdb.org/t/p/w500/2F6f0y8kX3FLMCe7yaHgRFSy4iE.jpg',
  'https://image.tmdb.org/t/p/w500/1BIoJG1bzcjJKimyLGxcRqA9IBx.jpg',
  'https://image.tmdb.org/t/p/w500/ArWn6Ts7zLFiKEwJzcG7tMS5GTK.jpg',
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BytUEM2qQYPw.jpg',
  'https://image.tmdb.org/t/p/w500/9cRk8j0G4zN9v7BqxJkYxAIXu3.jpg',
  'https://image.tmdb.org/t/p/w500/9s6eSMBiVlAAB1bJ7Tz5cHvP0RZ.jpg',
  'https://image.tmdb.org/t/p/w500/oU5PZdYGXTS7uIOP3S4HNFGFCA.jpg',
  'https://image.tmdb.org/t/p/w500/vZ3OXo8DnXfJLGKbFhA6Kjz4cR.jpg',
  'https://image.tmdb.org/t/p/w500/wW3F3kFHrFq1JvHq7T5PqCz3Qb.jpg',
];

const movies = Array.from({ length: 24 }, (_, i) => ({
  _id: `m${i + 1}`,
  title: ['The Shawshank Redemption', 'The Godfather', 'Dark Knight', 'Pulp Fiction', 'Inception', 'Interstellar', 'Fight Club', 'Forrest Gump', 'The Matrix', 'Goodfellas', 'Silence of Lambs', 'Saving Ryan', 'Green Mile', 'Gladiator', 'Departed', 'Prestige', 'Parasite', 'Joker', '1917', 'Dune', 'Tenet', 'Oppenheimer', 'Barbie', 'John Wick'][i],
  titleAr: ['الخلاص من شوشانك', 'العراب', 'فارس الظلام', 'خيال رخيص', 'بداية', 'بين النجوم', 'نادي القتال', 'فورست غامب', 'ماتريكس', 'رفاق طيبون', 'صمت الحملان', 'إنقاذ الجندي رايان', 'الميل الأخضر', 'جلاديتور', 'المغادرون', 'الخدعة', 'طفيلي', 'جوكر', '1917', 'كثيب', 'تينيت', 'أوبنهايمر', 'باربي', 'جون ويك'][i],
  slug: `movie-${i + 1}`,
  description: 'A captivating story that keeps you on the edge of your seat from start to finish. An unforgettable cinematic experience.',
  descriptionAr: 'قصة آسرة تبقيك على حافة مقعدك من البداية إلى النهاية. تجربة سينمائية لا تُنسى.',
  poster: posters[i % posters.length],
  thumbnail: posters[i % posters.length],
  trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  rating: parseFloat((7 + Math.random() * 3).toFixed(1)),
  year: [2020, 2021, 2022, 2023, 2024][i % 5],
  duration: `${120 + Math.floor(Math.random() * 60)} دقيقة`,
  genres: [genres[i % genres.length], genres[(i + 3) % genres.length]].map(g => ({ ...g })),
  actors: [actors[i % actors.length], actors[(i + 2) % actors.length]].map(a => ({ ...a })),
  embedLinks: ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
  quality: ['HD', 'Full HD', '4K'][i % 3],
  language: 'عربية',
  views: Math.floor(Math.random() * 100000) + 10000,
  featured: i < 6,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

const series = Array.from({ length: 12 }, (_, i) => ({
  _id: `s${i + 1}`,
  title: ['Game of Thrones', 'Breaking Bad', 'Stranger Things', 'The Crown', 'Friends', 'Sherlock', 'Dark', 'Money Heist', 'Squid Game', 'The Last of Us', 'Succession', 'The Mandalorian'][i],
  titleAr: ['صراع العروش', 'بريكينغ باد', 'أشياء غريبة', 'التاج', 'أصدقاء', 'شيرلوك', 'ظلام', 'سرقة المال', 'لعبة الحبار', 'آخر منا', 'الخلافة', 'الماندالوريان'][i],
  slug: `series-${i + 1}`,
  description: 'An epic series that captivated millions worldwide.',
  descriptionAr: 'مسلسل ملحمي أسر الملايين حول العالم.',
  poster: posters[(i + 8) % posters.length],
  thumbnail: posters[(i + 8) % posters.length],
  rating: parseFloat((8 + Math.random() * 2).toFixed(1)),
  year: [2019, 2020, 2021, 2022, 2023][i % 5],
  genres: [genres[i % genres.length]],
  actors: [actors[i % actors.length]],
  seasons: Math.floor(Math.random() * 5) + 1,
  episodes: [],
  status: ['ongoing', 'completed'][i % 2],
  views: Math.floor(Math.random() * 200000) + 50000,
  featured: i < 3,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

series.forEach(s => {
  s.episodes = Array.from({ length: 8 }, (_, i) => ({
    _id: `ep-${s._id}-${i + 1}`,
    series: s._id,
    title: `Episode ${i + 1}`,
    titleAr: `الحلقة ${i + 1}`,
    season: Math.floor(i / 4) + 1,
    episode: (i % 4) + 1,
    embedLinks: ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
    thumbnail: posters[(i + s._id.length) % posters.length],
    duration: `${40 + Math.floor(Math.random() * 20)} دقيقة`,
    views: Math.floor(Math.random() * 50000),
    createdAt: new Date().toISOString(),
  }));
});

const comments = [
  { _id: 'c1', user: { _id: 'u1', name: 'أحمد محمد', avatar: '' }, text: 'فيلم رائع جداً، أنصح الجميع بمشاهدته', likes: ['u1', 'u2'], replies: [], createdAt: new Date().toISOString() },
  { _id: 'c2', user: { _id: 'u2', name: 'سارة علي', avatar: '' }, text: 'قصة جميلة وأداء رائع من الممثلين', likes: ['u1'], replies: [], createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: 'c3', user: { _id: 'u3', name: 'محمود حسن', avatar: '' }, text: 'من أفضل الأفلام اللي شفتها这一年', likes: [], replies: [], createdAt: new Date(Date.now() - 7200000).toISOString() },
];

let mockUsers = [
  { _id: 'admin1', name: 'Admin', email: 'admin@moviemycima.com', password: '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5KhKx5x5x5x5x5x5x5x5', role: 'admin', avatar: '', bookmarks: [], preferences: { language: 'ar', quality: 'auto' }, createdAt: new Date().toISOString() },
];

module.exports = { genres, actors, movies, series, comments, mockUsers };
