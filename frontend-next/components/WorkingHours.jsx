"use client";
import { useState, useEffect } from 'react';

// Stub - availability API not available in RL environment
const availabilityAPI = {
  getWorkingHours: async () => [],
  getUserPreferences: async () => ({ show_week_numbers: false, show_declined_events: false, default_event_duration: 60 }),
  updateWorkingHours: async () => {},
  updateUserPreferences: async () => {},
};

const DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

function WorkingHours({ onClose }) {
  const [workingHours, setWorkingHours] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hours, prefs] = await Promise.all([
        availabilityAPI.getWorkingHours(),
        availabilityAPI.getUserPreferences()
      ]);

      // Ensure all days are represented
      const hoursMap = {};
      hours.forEach(h => {
        hoursMap[h.day_of_week] = h;
      });

      const allDays = DAYS.map(day => {
        if (hoursMap[day.value]) {
          return {
            ...hoursMap[day.value],
            is_available: hoursMap[day.value].is_available !== false
          };
        }
        return {
          day_of_week: day.value,
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: false
        };
      });

      setWorkingHours(allDays);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    setWorkingHours(prev =>
      prev.map(wh =>
        wh.day_of_week === dayOfWeek
          ? { ...wh, is_available: !wh.is_available }
          : wh
      )
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setWorkingHours(prev =>
      prev.map(wh =>
        wh.day_of_week === dayOfWeek
          ? { ...wh, [field]: value }
          : wh
      )
    );
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        availabilityAPI.updateWorkingHours(workingHours),
        availabilityAPI.updateUserPreferences(preferences)
      ]);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('Failed to save working hours');
    } finally {
      setSaving(false);
    }
  };

  const setWeekdayHours = () => {
    setWorkingHours(prev =>
      prev.map(wh => ({
        ...wh,
        is_available: wh.day_of_week >= 1 && wh.day_of_week <= 5, // Mon-Fri
        start_time: '09:00:00',
        end_time: '17:00:00'
      }))
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-google-blue-600 mx-auto"></div>
          <p className="text-sm text-google-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-google-gray-200">
          <h2 className="text-xl font-normal text-google-gray-700">Working hours</h2>
          <button
            className="btn-icon w-10 h-10"
            onClick={onClose}
          >
            <span className="material-icons-outlined text-google-gray-700">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          {/* Quick action */}
          <div className="mb-6">
            <button
              onClick={setWeekdayHours}
              className="text-sm text-google-blue-600 hover:underline"
            >
              Set weekday hours (Mon-Fri, 9 AM - 5 PM)
            </button>
          </div>

          {/* Days list */}
          <div className="space-y-3">
            {DAYS.map((day) => {
              const wh = workingHours.find(w => w.day_of_week === day.value);
              if (!wh) return null;

              return (
                <div
                  key={day.value}
                  className="flex items-center gap-4 p-3 bg-google-gray-50 rounded-lg hover:bg-google-gray-100 transition-colors"
                >
                  <label className="flex items-center gap-3 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={wh.is_available}
                      onChange={() => handleToggleDay(day.value)}
                      className="w-5 h-5 text-google-blue-600 rounded focus:ring-google-blue-600 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-google-gray-700">
                      {day.label}
                    </span>
                  </label>

                  {wh.is_available ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="time"
                        value={wh.start_time.slice(0, 5)}
                        onChange={(e) => handleTimeChange(day.value, 'start_time', e.target.value + ':00')}
                        className="input-field text-sm"
                      />
                      <span className="text-google-gray-600">to</span>
                      <input
                        type="time"
                        value={wh.end_time.slice(0, 5)}
                        onChange={(e) => handleTimeChange(day.value, 'end_time', e.target.value + ':00')}
                        className="input-field text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-google-gray-500 flex-1">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preferences */}
          {preferences && (
            <div className="mt-6 pt-6 border-t border-google-gray-200 space-y-4">
              <h3 className="text-sm font-medium text-google-gray-700 mb-3">Preferences</h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.show_week_numbers}
                  onChange={(e) => handlePreferenceChange('show_week_numbers', e.target.checked)}
                  className="w-5 h-5 text-google-blue-600 rounded focus:ring-google-blue-600 cursor-pointer mt-0.5"
                />
                <div>
                  <div className="text-sm text-google-gray-700">
                    Show week numbers
                  </div>
                  <div className="text-xs text-google-gray-600 mt-1">
                    Display week numbers in calendar views
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.show_declined_events}
                  onChange={(e) => handlePreferenceChange('show_declined_events', e.target.checked)}
                  className="w-5 h-5 text-google-blue-600 rounded focus:ring-google-blue-600 cursor-pointer mt-0.5"
                />
                <div>
                  <div className="text-sm text-google-gray-700">
                    Show declined events
                  </div>
                  <div className="text-xs text-google-gray-600 mt-1">
                    Display events you've declined on your calendar
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Default event duration
                </label>
                <select
                  value={preferences.default_event_duration || 60}
                  onChange={(e) => handlePreferenceChange('default_event_duration', parseInt(e.target.value))}
                  className="input-field text-sm w-48"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-google-gray-200 bg-google-gray-50">
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary px-6 py-2 text-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkingHours;
