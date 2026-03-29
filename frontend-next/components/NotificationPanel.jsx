"use client";
import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';
import './NotificationPanel.css';

function NotificationPanel({ onClose }) {
  const { events, fetchMyInvitations, invitations, updateRsvp } = useCalendarStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchMyInvitations();
    generateUpcomingNotifications();
  }, [events]);

  const generateUpcomingNotifications = () => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = events
      .filter(event => {
        const eventStart = new Date(event.start_time);
        return eventStart >= now && eventStart <= in24Hours;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(event => ({
        id: event.id,
        type: 'upcoming',
        title: event.title,
        time: new Date(event.start_time),
        calendar: event.calendar_name,
        color: event.color,
        location: event.location,
      }));

    setNotifications(upcoming);
  };

  const formatEventTime = (time) => {
    const now = new Date();
    const diff = time - now;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
      return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return time.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const handleRsvpResponse = async (eventId, status) => {
    try {
      await updateRsvp(eventId, status);
      await fetchMyInvitations();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h2 className="notification-title">Notifications</h2>
        <button onClick={onClose} className="icon-button">
          <span className="material-icons-outlined">close</span>
        </button>
      </div>

      <div className="notification-tabs">
        <button
          className={`notification-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <span className="material-icons-outlined">schedule</span>
          Upcoming ({notifications.length})
        </button>
        <button
          className={`notification-tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          <span className="material-icons-outlined">mail</span>
          Invitations ({invitations ? invitations.length : 0})
        </button>
      </div>

      <div className="notification-content scrollbar-thin">
        {activeTab === 'upcoming' && (
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="material-icons-outlined">event_available</span>
                <p>No upcoming events in the next 24 hours</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="notification-item">
                  <div
                    className="notification-indicator"
                    style={{ backgroundColor: notif.color || '#1a73e8' }}
                  />
                  <div className="notification-body">
                    <div className="notification-event-title">{notif.title}</div>
                    <div className="notification-meta">
                      <span className="material-icons-outlined">schedule</span>
                      <span>{formatEventTime(notif.time)}</span>
                    </div>
                    {notif.location && (
                      <div className="notification-meta">
                        <span className="material-icons-outlined">location_on</span>
                        <span>{notif.location}</span>
                      </div>
                    )}
                    <div className="notification-calendar">{notif.calendar}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="notification-list">
            {!invitations || invitations.length === 0 ? (
              <div className="notification-empty">
                <span className="material-icons-outlined">mail_outline</span>
                <p>No pending invitations</p>
              </div>
            ) : (
              invitations.map(invitation => (
                <div key={invitation.event_id} className="notification-item invitation-item">
                  <div className="notification-body">
                    <div className="notification-event-title">{invitation.event_title}</div>
                    <div className="notification-meta">
                      <span className="material-icons-outlined">schedule</span>
                      <span>
                        {new Date(invitation.event_start).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="notification-meta">
                      <span className="material-icons-outlined">person</span>
                      <span>Organized by {invitation.organizer_name || invitation.organizer_email}</span>
                    </div>

                    <div className="invitation-actions">
                      <button
                        onClick={() => handleRsvpResponse(invitation.event_id, 'accepted')}
                        className="rsvp-button accept"
                      >
                        <span className="material-icons-outlined">check</span>
                        Yes
                      </button>
                      <button
                        onClick={() => handleRsvpResponse(invitation.event_id, 'maybe')}
                        className="rsvp-button maybe"
                      >
                        <span className="material-icons-outlined">help_outline</span>
                        Maybe
                      </button>
                      <button
                        onClick={() => handleRsvpResponse(invitation.event_id, 'declined')}
                        className="rsvp-button decline"
                      >
                        <span className="material-icons-outlined">close</span>
                        No
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
