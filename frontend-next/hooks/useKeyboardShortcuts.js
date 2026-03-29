import { useEffect } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';

/**
 * useKeyboardShortcuts - Google Calendar-style keyboard shortcuts
 *
 * Shortcuts:
 * - c: Create new event
 * - d: Day view
 * - w: Week view
 * - m: Month view
 * - s: Schedule view
 * - t: Today
 * - j/n: Next period
 * - k/p: Previous period
 * - /: Search (focus search bar)
 * - Escape: Close dialogs
 * - ?: Show keyboard shortcuts help
 */
function useKeyboardShortcuts({ onCreateEvent, onToggleSearch, onShowHelp }) {
  const { setView, setDate, currentDate, currentView } = useCalendarStore();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input field
      const target = e.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Check for modifier keys (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case 'c':
          // Create new event
          e.preventDefault();
          onCreateEvent?.();
          break;

        case 'd':
          // Day view
          e.preventDefault();
          setView('day');
          break;

        case 'w':
          // Week view
          e.preventDefault();
          setView('week');
          break;

        case 'm':
          // Month view
          e.preventDefault();
          setView('month');
          break;

        case 'a':
          // Schedule/Agenda view
          e.preventDefault();
          setView('schedule');
          break;

        case 't':
          // Today
          e.preventDefault();
          setDate(new Date());
          break;

        case 'j':
        case 'n':
          // Next period
          e.preventDefault();
          navigateNext();
          break;

        case 'k':
        case 'p':
          // Previous period
          e.preventDefault();
          navigatePrevious();
          break;

        case '/':
          // Focus search
          e.preventDefault();
          onToggleSearch?.();
          break;

        case '?':
          // Show keyboard shortcuts help
          e.preventDefault();
          onShowHelp?.();
          break;

        default:
          break;
      }
    };

    const navigateNext = () => {
      const newDate = new Date(currentDate);
      if (currentView === 'day') {
        newDate.setDate(newDate.getDate() + 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === 'schedule') {
        newDate.setDate(newDate.getDate() + 7);
      }
      setDate(newDate);
    };

    const navigatePrevious = () => {
      const newDate = new Date(currentDate);
      if (currentView === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === 'schedule') {
        newDate.setDate(newDate.getDate() - 7);
      }
      setDate(newDate);
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentDate, currentView, setView, setDate, onCreateEvent, onToggleSearch, onShowHelp]);

  return null;
}

export default useKeyboardShortcuts;
