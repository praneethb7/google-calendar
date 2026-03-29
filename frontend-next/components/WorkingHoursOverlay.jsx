"use client";
import { useState, useEffect } from 'react';

// Stub - availability API not available in RL environment
const availabilityAPI = {
  getWorkingHours: async () => [],
  getUserPreferences: async () => null,
};

function WorkingHoursOverlay({ date, viewType = 'week' }) {
  const [workingHours, setWorkingHours] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    try {
      const [hours, prefs] = await Promise.all([
        availabilityAPI.getWorkingHours(),
        availabilityAPI.getUserPreferences()
      ]);
      setWorkingHours(hours);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show working hours overlay if user has working hours set
  if (loading || !workingHours || workingHours.length === 0) {
    return null;
  }

  const timeToPercentage = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / 1440) * 100; // 1440 minutes in a day
  };

  const getWorkingHoursForDay = (dayOfWeek) => {
    return workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_available);
  };

  // For week view, render overlays for each day column
  if (viewType === 'week') {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    return (
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="grid grid-cols-7 h-full">
          {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + dayOffset);
            const dayOfWeek = currentDate.getDay();
            const wh = getWorkingHoursForDay(dayOfWeek);

            if (!wh) {
              // Non-working day - fully shaded
              return (
                <div
                  key={dayOffset}
                  className="relative bg-google-gray-100/40"
                />
              );
            }

            const startPercent = timeToPercentage(wh.start_time);
            const endPercent = timeToPercentage(wh.end_time);

            return (
              <div key={dayOffset} className="relative">
                {/* Before working hours */}
                {startPercent > 0 && (
                  <div
                    className="absolute left-0 right-0 bg-google-gray-100/40"
                    style={{
                      top: 0,
                      height: `${startPercent}%`
                    }}
                  />
                )}
                {/* After working hours */}
                {endPercent < 100 && (
                  <div
                    className="absolute left-0 right-0 bg-google-gray-100/40"
                    style={{
                      top: `${endPercent}%`,
                      height: `${100 - endPercent}%`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // For day view
  if (viewType === 'day') {
    const dayOfWeek = date.getDay();
    const wh = getWorkingHoursForDay(dayOfWeek);

    if (!wh) {
      // Non-working day - fully shaded
      return (
        <div className="absolute inset-0 pointer-events-none z-0 bg-google-gray-100/40" />
      );
    }

    const startPercent = timeToPercentage(wh.start_time);
    const endPercent = timeToPercentage(wh.end_time);

    return (
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Before working hours */}
        {startPercent > 0 && (
          <div
            className="absolute left-0 right-0 bg-google-gray-100/40"
            style={{
              top: 0,
              height: `${startPercent}%`
            }}
          />
        )}
        {/* After working hours */}
        {endPercent < 100 && (
          <div
            className="absolute left-0 right-0 bg-google-gray-100/40"
            style={{
              top: `${endPercent}%`,
              height: `${100 - endPercent}%`
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

export default WorkingHoursOverlay;
