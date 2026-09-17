import { useTheme } from '../lib/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark'
    || (theme === null && typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      className={`theme-switch ${isDark ? 'on' : ''} ${className}`}
      onClick={toggle}
      title={isDark ? 'Passa a modalità chiara' : 'Passa a modalità scura'}
      aria-label="Cambia tema"
    >
      <span className="theme-switch-icon theme-switch-icon-sun">☀️</span>
      <span className="theme-switch-icon theme-switch-icon-moon">🌙</span>
      <span className="theme-switch-knob" />
    </button>
  );
}
