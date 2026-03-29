"use client";
import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

function ThemeToggle() {
  const { theme, toggleTheme, initTheme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Get the actual displayed theme (system might be dark or light)
  const getDisplayTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const displayTheme = getDisplayTheme();

  return (
    <button
      onClick={toggleTheme}
      className="icon-button"
      aria-label={`Switch to ${displayTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${displayTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {displayTheme === 'light' ? (
        // Moon icon for dark mode
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            fill="currentColor"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <path
            d="M12 1v2m0 18v2M23 12h-2M3 12H1m17.07-7.07l-1.41 1.41M5.34 18.66l-1.41 1.41m14.14 0l-1.41-1.41M5.34 5.34L3.93 3.93"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
