"use client";
import { useState } from 'react';

/**
 * RecurringEditDialog - Google Calendar-style dialog for editing recurring events
 * Appears when user tries to edit a recurring event
 * Options: This event | This and following events | All events
 */
function RecurringEditDialog({ isOpen, onClose, onSelect, eventTitle }) {
  const [selectedScope, setSelectedScope] = useState('this');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSelect(selectedScope);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-normal text-gray-800">
            Edit recurring event
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm text-gray-600 mb-6">
            "{eventTitle}" is a recurring event. Which events do you want to edit?
          </p>

          <div className="space-y-3">
            {/* This event only */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="scope"
                value="this"
                checked={selectedScope === 'this'}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="mt-0.5 w-5 h-5 text-google-blue-600 border-gray-300 focus:ring-google-blue-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-800 group-hover:text-google-blue-600">
                  This event
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Only this instance will be modified
                </div>
              </div>
            </label>

            {/* This and following events */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="scope"
                value="thisAndFuture"
                checked={selectedScope === 'thisAndFuture'}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="mt-0.5 w-5 h-5 text-google-blue-600 border-gray-300 focus:ring-google-blue-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-800 group-hover:text-google-blue-600">
                  This and following events
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  This and all future instances will be modified
                </div>
              </div>
            </label>

            {/* All events */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="scope"
                value="all"
                checked={selectedScope === 'all'}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="mt-0.5 w-5 h-5 text-google-blue-600 border-gray-300 focus:ring-google-blue-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-800 group-hover:text-google-blue-600">
                  All events
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  All instances in the series will be modified
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary px-6 py-2 text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecurringEditDialog;
