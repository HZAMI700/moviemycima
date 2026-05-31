'use client';

import Link from 'next/link';

const footerLinks = {
  التصفح: [
    { href: '/movies', label: 'الأفلام' },
    { href: '/series', label: 'المسلسلات' },
    { href: '/movies?sort=-rating', label: 'الأعلى تقييماً' },
    { href: '/movies?sort=-year', label: 'الأحدث' },
  ],
  الروابط: [
    { href: '/', label: 'الرئيسية' },
    { href: '/search', label: 'بحث' },
    { href: '/profile', label: 'المفضلة' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-dark-800 bg-dark-950 mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-bold gradient-text">MovieMyCima</Link>
            <p className="mt-3 text-dark-400 text-sm leading-relaxed">
              منصتك الأولى لمشاهدة الأفلام والمسلسلات العربية والعالمية مترجمة ومدبلجة بجودة عالية
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold text-sm mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-dark-400 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dark-500 text-sm">© {new Date().getFullYear()} MovieMyCima. جميع الحقوق محفوظة</p>
          <p className="text-dark-500 text-sm">صنع بـ ❤️ لمحبي السينما</p>
        </div>
      </div>
    </footer>
  );
}
