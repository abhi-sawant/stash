import { Home, FolderOpen, Search, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Home', icon: <Home className="h-6 w-6" />, path: '/' },
  { label: 'Collections', icon: <FolderOpen className="h-6 w-6" />, path: '/collections' },
  { label: 'Search', icon: <Search className="h-6 w-6" />, path: '/search' },
  { label: 'Profile', icon: <User className="h-6 w-6" />, path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  const handleNavClick = () => {
    hapticFeedback.light();
  };

  return (
    <nav className="bg-card border-border fixed right-0 bottom-0 left-0 z-50 border-t">
      <div className="flex h-16 items-center justify-around">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
                'active:bg-card',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
