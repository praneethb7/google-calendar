"use client";
import { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';

/**
 * QuickAdd - Google Calendar-style quick event creation
 * Example: "Lunch with John tomorrow at 1pm"
 * Parses natural language input to create events quickly
 */
function QuickAdd({ isOpen, onClose }) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef();
  const { createEvent, calendars } = useCalendarStore();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const parseQuickAdd = (text) => {
    const now = new Date();
    let title = text;
    let startTime = new Date(now);
    startTime.setHours(now.getHours() + 1, 0, 0, 0); // Default: 1 hour from now
    let endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1); // Default: 1 hour duration

    // Parse time patterns
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const timeMatch = text.match(timePattern);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      startTime.setHours(hours, minutes, 0, 0);
      endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      // Remove time from title
      title = text.replace(timeMatch[0], '').trim();
    }

    // Parse date patterns
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const datePatterns = {
      'tomorrow': tomorrow,
      'today': now,
    };

    // Days of week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const nextWeekPattern = /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
    const dayPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;

    const nextWeekMatch = text.match(nextWeekPattern);
    const dayMatch = text.match(dayPattern);

    if (nextWeekMatch) {
      const targetDay = daysOfWeek.indexOf(nextWeekMatch[1].toLowerCase());
      const daysUntil = (targetDay + 7 - now.getDay()) % 7 || 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntil + 7);
      startTime.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endTime.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      title = text.replace(nextWeekMatch[0], '').trim();
    } else if (dayMatch) {
      const targetDay = daysOfWeek.indexOf(dayMatch[1].toLowerCase());
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntil);
      startTime.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endTime.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      title = text.replace(dayMatch[0], '').trim();
    } else {
      for (const [keyword, date] of Object.entries(datePatterns)) {
        if (text.toLowerCase().includes(keyword)) {
          startTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          endTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          title = text.replace(new RegExp(keyword, 'i'), '').trim();
          break;
        }
      }
    }

    // Clean up title (remove common prepositions)
    title = title.replace(/\s+(at|on|in)\s+/gi, ' ').trim();

    return {
      title: title || 'New Event',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !calendars.length) return;

    setIsProcessing(true);

    try {
      const parsed = parseQuickAdd(input);

      await createEvent({
        calendarId: calendars[0].id, // Use first calendar
        title: parsed.title,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isAllDay: false,
        description: '',
        location: '',
        reminders: [],
      });

      setInput('');
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center pt-20 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="material-icons-outlined text-google-gray-600 text-2xl">
                add
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add title, date, and time (e.g., 'Lunch tomorrow at 1pm')"
                className="flex-1 text-lg text-google-gray-700 border-none outline-none bg-transparent"
                disabled={isProcessing}
              />
            </div>

            {/* Helpful examples */}
            <div className="mt-3 pt-3 border-t border-google-gray-200">
              <div className="text-xs text-google-gray-600 mb-2 font-medium">
                Try these examples:
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Meeting tomorrow at 2pm',
                  'Lunch on Friday at 12:30',
                  'Call Sarah next Monday 3pm',
                  'Dentist appointment today at 4pm',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setInput(example)}
                    className="text-xs bg-google-gray-100 hover:bg-google-gray-200 text-google-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-google-gray-200 bg-google-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-google-gray-700 hover:bg-google-gray-100 px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-google-blue-600 hover:bg-google-blue-50 px-4 py-2 rounded transition-colors font-medium"
              >
                More options
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="bg-google-blue-600 text-white px-6 py-2 rounded hover:bg-google-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickAdd;
