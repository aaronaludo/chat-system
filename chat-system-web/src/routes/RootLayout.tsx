import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { applyTheme, getInitialTheme, persistTheme } from '../theme';
import type { ThemeMode } from '../theme';
import logo from '../assets/images/logo.png';
import logoTransparent from '../assets/images/logo-transparent.png';

type NavItem =
  | { type: 'route'; label: string; to: string; end?: boolean }
  | { type: 'external'; label: string; href: string };

const navItems: NavItem[] = [
  { type: 'route', label: 'Overview', to: '/', end: true },
  { type: 'route', label: 'Live chat', to: '/chat' },
  { type: 'route', label: 'Global chat', to: '/global-chat' },
  { type: 'external', label: 'API docs', href: 'http://localhost:8000/docs' },
];

const RootLayout = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const preferred = getInitialTheme();
    applyTheme(preferred);
    return preferred;
  });

  const buildLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' is-active' : ''}`;

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app-frame">
      <header className="site-header">
        <NavLink to="/" className="brand">
          <span className="brand-logos" aria-hidden="true">
            <img className="brand-logo brand-logo--solid" src={logo} alt="" loading="lazy" />
            <img
              className="brand-logo brand-logo--transparent"
              src={logoTransparent}
              alt=""
              loading="lazy"
            />
          </span>
          <span className="brand-name">Chat System</span>
        </NavLink>
        <nav className="nav-links">
          {navItems.map((item) =>
            item.type === 'route' ? (
              <NavLink key={item.label} to={item.to} className={buildLinkClass} end={item.end}>
                {item.label}
              </NavLink>
            ) : (
              <a
                key={item.label}
                className="nav-link"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            )
          )}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
            <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'} mode</span>
          </button>
          <a className="header-cta" href="https://www.linkedin.com/in/aaronaludo">
            Need a custom build? Let's talk!
          </a>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()}. All rights reserved.</p>
        <div className="footer-links">
          <a href="https://github.com/aaronaludo/chat-system/" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/aaronaludo/" target="_blank" rel="noreferrer">
            Aaron Aludo
          </a>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
