import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Compass, Sun, Moon, Menu, X, LogOut, User, MapPinned, Cloud, UtensilsCrossed, Sparkles, Plane, Bookmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { classNames } from '@/utils/format';

const navLinks = [
  { to: '/explore', label: 'Explore', icon: MapPinned },
  { to: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { to: '/weather', label: 'Weather', icon: Cloud },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className={classNames(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'glass-strong shadow-sm' : 'bg-transparent',
    )}>
      <nav className="container-app h-16 flex items-center justify-between">
        <Link to={user ? "/trips" : "/"} className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">VoyageAI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={classNames(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                  active ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{user.name}</span>
                </button>
              }
            >
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <DropdownItem icon={<User className="w-4 h-4" />} onClick={() => navigate('/profile')}>Profile</DropdownItem>
              <DropdownItem icon={<Plane className="w-4 h-4" />} onClick={() => navigate('/trips')}>My Trips</DropdownItem>
              <DropdownItem icon={<Sparkles className="w-4 h-4" />} onClick={() => navigate('/plan')}>Plan a Trip</DropdownItem>
              <DropdownItem icon={<LogOut className="w-4 h-4" />} danger onClick={handleLogout}>Logout</DropdownItem>
            </Dropdown>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 transition">Login</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition shadow-sm">Sign up</Link>
            </div>
          )}

          <button onClick={() => setMobileOpen((o) => !o)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-gray-100 dark:border-gray-800 animate-fade-in-down">
          <div className="container-app py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <Icon className="w-4 h-4 text-primary-500" />
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <>
                <Link to="/trips" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <Plane className="w-4 h-4 text-primary-500" /> My Trips
                </Link>
                <Link to="/plan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <Bookmark className="w-4 h-4 text-primary-500" /> Plan a Trip
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 mt-2">
                <Link to="/login" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl">Login</Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
