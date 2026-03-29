"use client";
import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';

function CalendarShareModal({ calendar, onClose }) {
  const { shareCalendar, getCalendarShares, updateSharePermission, removeCalendarShare } = useCalendarStore();
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShares();
  }, [calendar.id]);

  const loadShares = async () => {
    try {
      const data = await getCalendarShares(calendar.id);
      setShares(data);
    } catch (err) {
      console.error('Failed to load shares:', err);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await shareCalendar(calendar.id, email, permission);
      setEmail('');
      setPermission('view');
      await loadShares();
    } catch (err) {
      setError(err.message || 'Failed to share calendar');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (shareId, newPermission) => {
    try {
      await updateSharePermission(calendar.id, shareId, newPermission);
      await loadShares();
    } catch (err) {
      alert('Failed to update permission');
    }
  };

  const handleRemoveShare = async (shareId) => {
    if (!window.confirm('Remove this user\'s access?')) return;

    try {
      await removeCalendarShare(calendar.id, shareId);
      await loadShares();
    } catch (err) {
      alert('Failed to remove share');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-google-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: calendar?.color || '#1a73e8' }}
            />
            <h2 className="text-xl font-normal text-google-gray-700">
              Share "{calendar.name}"
            </h2>
          </div>
          <button
            className="btn-icon w-10 h-10"
            onClick={onClose}
          >
            <span className="material-icons-outlined text-google-gray-700">close</span>
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          {/* Share form */}
          <form onSubmit={handleShare} className="mb-6">
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Add people
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field text-sm flex-1"
              />

              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="input-field text-sm w-32"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="manage">Manage</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>

            {error && (
              <div className="mt-2 text-sm text-google-red-600 bg-google-red-50 px-3 py-2 rounded">
                {error}
              </div>
            )}
          </form>

          {/* Shares list */}
          <div>
            <h3 className="text-sm font-medium text-google-gray-700 mb-3">
              People with access
            </h3>

            {shares.length === 0 ? (
              <p className="text-sm text-google-gray-600 py-4 text-center bg-google-gray-50 rounded">
                No one else has access to this calendar
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-google-gray-50 rounded hover:bg-google-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="material-icons-outlined text-google-gray-600 text-xl flex-shrink-0">
                        person
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-google-gray-700 truncate">
                          {share.shared_with_name || share.shared_with_email}
                        </div>
                        <div className="text-xs text-google-gray-600 truncate">
                          {share.shared_with_email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={share.permission}
                        onChange={(e) => handlePermissionChange(share.id, e.target.value)}
                        className="input-field text-sm py-1 px-2"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="manage">Manage</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-google-gray-600 hover:text-google-red-600 transition-colors"
                      >
                        <span className="material-icons-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarShareModal;
