"use client";
import { useState } from 'react';
import { useCalendarStore } from '@/store/useCalendarStore';

function SearchBar({ onEventClick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { calendars, selectedCalendars } = useCalendarStore();

  // Filter states
  const [filters, setFilters] = useState({
    calendarIds: '',
    startDate: '',
    endDate: '',
    status: 'all', // all, accepted, pending, declined, maybe
    eventType: 'all' // all, my-events, shared-events, invitations
  });

  const { searchEvents } = useCalendarStore();

  const handleSearch = async (searchQuery = query, currentFilters = filters) => {
    setQuery(searchQuery);

    if (!searchQuery.trim() && !hasActiveFilters(currentFilters)) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const events = await searchEvents(searchQuery);
      setResults(events || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const hasActiveFilters = (currentFilters) => {
    return currentFilters.startDate ||
           currentFilters.endDate ||
           currentFilters.status !== 'all' ||
           currentFilters.eventType !== 'all' ||
           currentFilters.calendarIds;
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    handleSearch(query, newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      calendarIds: '',
      startDate: '',
      endDate: '',
      status: 'all',
      eventType: 'all'
    };
    setFilters(newFilters);
    handleSearch(query, newFilters);
  };

  const handleResultClick = (event) => {
    setShowResults(false);
    setQuery('');
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {!isExpanded ? (
        <button
          className="icon-button"
          title="Search"
          aria-label="Search"
          onClick={() => setIsExpanded(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
          </svg>
        </button>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--color-bg-primary)',
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 'var(--z-search)',
          minWidth: '400px'
        }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
            width: '20px',
            height: '20px',
            color: 'var(--color-secondary-text)',
            marginLeft: 'var(--space-2)',
            flexShrink: 0
          }}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
          </svg>
          <input
            type="text"
            placeholder="Search events"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => (query || hasActiveFilters(filters)) && setShowResults(true)}
            onBlur={() => setTimeout(() => {
              if (!query && !hasActiveFilters(filters)) {
                setIsExpanded(false);
              }
              setShowResults(false);
            }, 200)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-primary-text)',
              padding: 'var(--space-2)'
            }}
          />
          {(showFilters || hasActiveFilters(filters)) && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="icon-button"
              title="Filters"
              style={{
                width: '32px',
                height: '32px',
                background: showFilters || hasActiveFilters(filters) ? 'var(--color-google-blue-light)' : 'transparent',
                color: showFilters || hasActiveFilters(filters) ? 'var(--color-google-blue)' : 'var(--color-secondary-text)'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              setIsExpanded(false);
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="icon-button"
            title="Close"
            style={{ width: '32px', height: '32px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && isExpanded && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: '400px',
          background: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border-light)',
          padding: 'var(--space-4)',
          zIndex: 'var(--z-dropdown)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-primary-text)'
            }}>Filters</h3>
            <button
              onClick={clearFilters}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-google-blue)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear all
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)'
          }}>
            {/* Event Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-primary-text)',
                marginBottom: 'var(--space-1)'
              }}>
                Event Type
              </label>
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-primary-text)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Events</option>
                <option value="my-events">My Events</option>
                <option value="shared-events">Shared Events</option>
                <option value="invitations">Invitations</option>
              </select>
            </div>

            {/* RSVP Status */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-primary-text)',
                marginBottom: 'var(--space-1)'
              }}>
                RSVP Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-primary-text)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All</option>
                <option value="accepted">Accepted</option>
                <option value="pending">Pending</option>
                <option value="maybe">Maybe</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-primary-text)',
                marginBottom: 'var(--space-1)'
              }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-primary-text)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-primary-text)',
                marginBottom: 'var(--space-1)'
              }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-primary-text)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {showResults && isExpanded && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: '400px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border-light)',
          zIndex: 'var(--z-dropdown)'
        }}>
          {isSearching ? (
            <div style={{
              padding: 'var(--space-4)',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-secondary-text)'
            }}>Searching...</div>
          ) : results.length > 0 ? (
            <>
              <div style={{
                padding: 'var(--space-2)',
                borderBottom: '1px solid var(--color-border-light)',
                background: 'var(--color-bg-hover)'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-secondary-text)'
                }}>
                  Found {results.length} event{results.length !== 1 ? 's' : ''}
                </div>
              </div>
              {results.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleResultClick(event)}
                  style={{
                    padding: 'var(--space-3)',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border-light)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: '4px',
                        height: '48px',
                        borderRadius: 'var(--radius-full)',
                        flexShrink: 0,
                        backgroundColor: event.calendar_color
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-1)',
                        color: 'var(--color-primary-text)'
                      }}>{event.title}</div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-secondary-text)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        {new Date(event.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                        {event.location && ` • ${event.location}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: event.calendar_color
                        }}>
                          {event.calendar_name}
                        </div>
                        {event.user_relation === 'attendee' && (
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-google-blue-light)',
                            color: 'var(--color-google-blue)'
                          }}>
                            Invited
                          </span>
                        )}
                        {event.user_relation === 'shared' && (
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-google-green-light)',
                            color: 'var(--color-google-green)'
                          }}>
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{
              padding: 'var(--space-4)',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-secondary-text)'
            }}>No events found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
