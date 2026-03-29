"use client";
import { useState, useEffect } from 'react';

// Stub - notifications API not available in RL environment
const notificationsAPI = {
  getTodayEvents: async () => [],
  getUpcomingEvents: async () => [],
};

function UpcomingEvents({ onEventClick }) {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // today, upcoming

  useEffect(() => {
    loadEvents();
    // Refresh every 5 minutes
    const interval = setInterval(loadEvents, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [today, upcoming] = await Promise.all([
        notificationsAPI.getTodayEvents(),
        notificationsAPI.getUpcomingEvents()
      ]);
      setTodayEvents(today);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getRsvpIcon = (status) => {
    switch (status) {
      case 'accepted':
        return { icon: 'check_circle', color: 'text-google-green-600' };
      case 'declined':
        return { icon: 'cancel', color: 'text-google-red-600' };
      case 'maybe':
        return { icon: 'help', color: 'text-google-yellow-700' };
      default:
        return { icon: 'schedule', color: 'text-google-gray-600' };
    }
  };

  const EventList = ({ events }) => {
    if (events.length === 0) {
      return (
        <div className="p-6 text-center text-sm text-google-gray-600">
          No events scheduled
        </div>
      );
    }

    return (
      <div className="divide-y divide-google-gray-100">
        {events.map((event) => {
          const rsvpStatus = getRsvpIcon(event.rsvp_status);
          return (
            <div
              key={event.id}
              className="p-3 hover:bg-google-gray-50 cursor-pointer transition-colors"
              onClick={() => onEventClick && onEventClick(event)}
            >
              <div className="flex gap-3">
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.calendar_color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-google-gray-700 line-clamp-2">
                      {event.title}
                    </h4>
                    {event.rsvp_status && (
                      <span className={`material-icons-outlined text-sm ${rsvpStatus.color}`}>
                        {rsvpStatus.icon}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-google-gray-600 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">schedule</span>
                      <span>
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1">
                        <span className="material-icons-outlined text-xs">location_on</span>
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: event.calendar_color }}
                      />
                      <span className="text-xs text-google-gray-500">
                        {event.calendar_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-google-gray-200 shadow-sm overflow-hidden">
      {/* Header with tabs */}
      <div className="border-b border-google-gray-200">
        <div className="flex">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'today'
                ? 'text-google-blue-600 border-google-blue-600 bg-google-blue-50'
                : 'text-google-gray-600 border-transparent hover:bg-google-gray-50'
            }`}
            onClick={() => setActiveTab('today')}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-icons-outlined text-lg">today</span>
              <span>Today ({todayEvents.length})</span>
            </div>
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'upcoming'
                ? 'text-google-blue-600 border-google-blue-600 bg-google-blue-50'
                : 'text-google-gray-600 border-transparent hover:bg-google-gray-50'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-icons-outlined text-lg">event</span>
              <span>Next 7 Days ({upcomingEvents.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-google-blue-600"></div>
            <p className="text-sm text-google-gray-600 mt-2">Loading events...</p>
          </div>
        ) : (
          <EventList events={activeTab === 'today' ? todayEvents : upcomingEvents} />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-google-gray-50 border-t border-google-gray-200">
        <button
          onClick={loadEvents}
          className="text-xs text-google-blue-600 hover:underline flex items-center gap-1"
        >
          <span className="material-icons-outlined text-sm">refresh</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

export default UpcomingEvents;
