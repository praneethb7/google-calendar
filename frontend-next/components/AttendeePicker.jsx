"use client";
import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';

function AttendeePicker({ eventId, canEdit = true }) {
  const { getEventAttendees, addAttendee, removeAttendee, updateRsvp } = useCalendarStore();
  const [attendees, setAttendees] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadAttendees();
    }
  }, [eventId]);

  const loadAttendees = async () => {
    const data = await getEventAttendees(eventId);
    setAttendees(data);
  };

  const handleAddAttendee = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await addAttendee(eventId, email, '');
      await loadAttendees();
      setEmail('');
      setShowAdd(false);
    } catch (error) {
      alert(error.message || 'Failed to add attendee');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (attendeeId) => {
    if (!window.confirm('Remove this attendee?')) return;

    try {
      await removeAttendee(eventId, attendeeId);
      await loadAttendees();
    } catch (error) {
      alert('Failed to remove attendee');
    }
  };

  const handleRsvpChange = async (status) => {
    try {
      await updateRsvp(eventId, status);
      await loadAttendees();
    } catch (error) {
      alert('Failed to update RSVP');
    }
  };

  const getRsvpColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'text-google-green-600 bg-google-green-50';
      case 'declined':
        return 'text-google-red-600 bg-google-red-50';
      case 'maybe':
        return 'text-google-yellow-700 bg-google-yellow-50';
      default:
        return 'text-google-gray-600 bg-google-gray-100';
    }
  };

  const getRsvpIcon = (status) => {
    switch (status) {
      case 'accepted':
        return 'check_circle';
      case 'declined':
        return 'cancel';
      case 'maybe':
        return 'help';
      default:
        return 'schedule';
    }
  };

  return (
    <div className="space-y-2">
      {attendees.length > 0 && (
        <div className="space-y-2 mb-3">
          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex items-center justify-between p-2 bg-google-gray-50 rounded text-sm"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className={`material-icons-outlined text-sm ${getRsvpColor(attendee.rsvp_status).split(' ')[0]}`}>
                  {getRsvpIcon(attendee.rsvp_status)}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-google-gray-700">
                    {attendee.user_name || attendee.name || attendee.email}
                  </div>
                  <div className="text-xs text-google-gray-600">{attendee.email}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getRsvpColor(attendee.rsvp_status)}`}>
                  {attendee.rsvp_status === 'pending' ? 'Pending' :
                   attendee.rsvp_status === 'accepted' ? 'Accepted' :
                   attendee.rsvp_status === 'maybe' ? 'Maybe' : 'Declined'}
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRemove(attendee.id)}
                  className="text-google-gray-600 hover:text-google-red-600 transition-colors ml-2"
                >
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <>
          {!showAdd ? (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="text-sm text-google-blue-600 hover:bg-google-blue-50 px-3 py-2 rounded transition-colors flex items-center gap-1"
            >
              <span className="material-icons-outlined text-sm">person_add</span>
              Add guests
            </button>
          ) : (
            <form onSubmit={handleAddAttendee} className="p-3 bg-google-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="text-google-blue-600 hover:underline text-sm"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-google-gray-700 mb-1">
                  Guest email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="input-field text-sm"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm px-4 py-2"
                >
                  {loading ? 'Adding...' : 'Add Guest'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* RSVP Buttons (for current user if they're an attendee) */}
      {eventId && attendees.some(a => a.user_id === parseInt(localStorage.getItem('userId'))) && (
        <div className="pt-3 border-t border-google-gray-200">
          <div className="text-xs font-medium text-google-gray-700 mb-2">Your response:</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRsvpChange('accepted')}
              className="flex-1 px-3 py-2 rounded text-sm font-medium border border-google-gray-300 hover:border-google-green-600 hover:bg-google-green-50 hover:text-google-green-700 transition-colors"
            >
              ✓ Yes
            </button>
            <button
              onClick={() => handleRsvpChange('maybe')}
              className="flex-1 px-3 py-2 rounded text-sm font-medium border border-google-gray-300 hover:border-google-yellow-600 hover:bg-google-yellow-50 hover:text-google-yellow-700 transition-colors"
            >
              ? Maybe
            </button>
            <button
              onClick={() => handleRsvpChange('declined')}
              className="flex-1 px-3 py-2 rounded text-sm font-medium border border-google-gray-300 hover:border-google-red-600 hover:bg-google-red-50 hover:text-google-red-700 transition-colors"
            >
              ✕ No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendeePicker;
