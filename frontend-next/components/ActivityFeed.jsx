"use client";
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * ActivityFeed - Google Calendar-style activity feed
 * Shows recent changes to calendars and events
 */
function ActivityFeed({ calendarId = null }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, events, calendars, shares

  useEffect(() => {
    loadActivities();
  }, [calendarId, filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const endpoint = calendarId
        ? `/api/activity/calendar/${calendarId}`
        : `/api/activity/feed`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    const icons = {
      event_created: 'add_circle',
      event_updated: 'edit',
      event_deleted: 'delete',
      calendar_shared: 'share',
      permission_changed: 'admin_panel_settings',
      rsvp_changed: 'event_available'
    };

    return icons[action] || 'info';
  };

  const getActivityColor = (action) => {
    const colors = {
      event_created: 'text-green-600 bg-green-50',
      event_updated: 'text-blue-600 bg-blue-50',
      event_deleted: 'text-red-600 bg-red-50',
      calendar_shared: 'text-purple-600 bg-purple-50',
      permission_changed: 'text-orange-600 bg-orange-50',
      rsvp_changed: 'text-indigo-600 bg-indigo-50'
    };

    return colors[action] || 'text-gray-600 bg-gray-50';
  };

  const getActivityMessage = (activity) => {
    const userName = activity.user_name || 'Someone';

    switch (activity.action) {
      case 'event_created':
        return (
          <span>
            <strong>{userName}</strong> created event{' '}
            <strong>"{activity.event_title}"</strong>
          </span>
        );
      case 'event_updated':
        return (
          <span>
            <strong>{userName}</strong> updated{' '}
            <strong>"{activity.event_title}"</strong>
            {activity.changes && renderChanges(activity.changes)}
          </span>
        );
      case 'event_deleted':
        return (
          <span>
            <strong>{userName}</strong> deleted event{' '}
            <strong>"{activity.event_title}"</strong>
          </span>
        );
      case 'calendar_shared':
        return (
          <span>
            <strong>{userName}</strong> shared{' '}
            <strong>"{activity.calendar_name}"</strong> calendar
          </span>
        );
      case 'permission_changed':
        return (
          <span>
            <strong>{userName}</strong> changed permissions on{' '}
            <strong>"{activity.calendar_name}"</strong>
          </span>
        );
      case 'rsvp_changed':
        const newStatus = activity.changes?.rsvp_status?.new;
        return (
          <span>
            <strong>{userName}</strong> {newStatus} event{' '}
            <strong>"{activity.event_title}"</strong>
          </span>
        );
      default:
        return (
          <span>
            <strong>{userName}</strong> performed action on{' '}
            {activity.event_title || activity.calendar_name}
          </span>
        );
    }
  };

  const renderChanges = (changes) => {
    if (!changes) return null;

    const changeList = Object.keys(changes).map(field => {
      const { old: oldVal, new: newVal } = changes[field];

      switch (field) {
        case 'title':
          return (
            <div key={field} className="text-xs text-gray-600 mt-1">
              Title: <del className="text-gray-400">{oldVal}</del> → {newVal}
            </div>
          );
        case 'start_time':
        case 'end_time':
          return (
            <div key={field} className="text-xs text-gray-600 mt-1">
              {field === 'start_time' ? 'Start' : 'End'}:{' '}
              {new Date(newVal).toLocaleString()}
            </div>
          );
        default:
          return null;
      }
    });

    return changeList.length > 0 ? (
      <div className="mt-1">{changeList}</div>
    ) : null;
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'events') return activity.entity_type === 'event';
    if (filter === 'calendars') return activity.entity_type === 'calendar';
    if (filter === 'shares') return activity.action.includes('share');
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-google-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Activity</h3>

          {/* Filter */}
          <div className="flex gap-1">
            {['all', 'events', 'calendars', 'shares'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === f
                    ? 'bg-google-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <span className="material-icons-outlined text-4xl text-gray-300 mb-2">
              history
            </span>
            <p>No recent activity</p>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                  <span className="material-icons-outlined text-lg">
                    {getActivityIcon(activity.action)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800">
                    {getActivityMessage(activity)}
                  </div>

                  {/* Calendar Badge */}
                  {activity.calendar_name && (
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activity.calendar_color }}
                      />
                      <span className="text-xs text-gray-600">
                        {activity.calendar_name}
                      </span>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
