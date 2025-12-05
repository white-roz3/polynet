'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Agents', href: '/agents' },
  { name: 'Markets', href: '/markets' },
  { name: 'Predictions', href: '/predictions' },
  { name: 'Leaderboard', href: '/leaderboards' },
];

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center group">
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span 
            className="text-2xl font-black tracking-tight"
            style={{ 
              fontFamily: 'Outfit, sans-serif',
              background: 'linear-gradient(135deg, #00FF9F 0%, #00D882 50%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(0, 255, 159, 0.3))'
            }}
          >
            Poly
          </span>
          <span 
            className="text-2xl font-black tracking-tight text-white"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Net
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MainNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="kalshinet-nav">
      <div className="kalshinet-nav-inner">
        <Logo />
        
        <div className="kalshinet-nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`kalshinet-nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/agents/create" 
            className="kalshinet-btn kalshinet-btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Agent
          </Link>
        </div>
      </div>
    </nav>
  );
}
