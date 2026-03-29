"use client";
import { useState, useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import TimezoneSelector from './TimezoneSelector';
import WorkingHours from './WorkingHours';

function SettingsModal({ onClose }) {
  const { theme, setTheme, initTheme } = useThemeStore();
  const [showWorkingHours, setShowWorkingHours] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: '☀️',
      description: 'Light theme provides a bright, clear interface'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: '🌙',
      description: 'Dark theme reduces eye strain in low-light environments'
    },
    {
      value: 'system',
      label: 'Device theme',
      icon: '💻',
      description: 'Theme automatically adjusts based on your device settings'
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          transition: 'background-color 0.3s'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border-light)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--color-primary-text)',
            margin: 0
          }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 100px)'
        }}>
          {/* Appearance Section */}
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-primary-text)',
              marginBottom: 'var(--space-4)'
            }}>
              Appearance
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {themes.map((themeOption) => (
                <label
                  key={themeOption.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${theme === themeOption.value ? 'var(--color-google-blue)' : 'var(--color-border-light)'}`,
                    background: theme === themeOption.value ? 'var(--color-google-blue-light)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== themeOption.value) {
                      e.currentTarget.style.background = 'var(--color-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== themeOption.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={themeOption.value}
                    checked={theme === themeOption.value}
                    onChange={() => setTheme(themeOption.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    fontSize: '24px',
                    marginRight: 'var(--space-4)',
                    flexShrink: 0
                  }}>
                    {themeOption.icon}
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: theme === themeOption.value ? 'var(--color-google-blue)' : 'var(--color-primary-text)',
                    flex: 1
                  }}>
                    {themeOption.label}
                  </span>
                  {theme === themeOption.value && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="var(--color-google-blue)"/>
                    </svg>
                  )}
                </label>
              ))}
            </div>

            <p style={{
              marginTop: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-secondary-text)',
              lineHeight: '1.5'
            }}>
              {themes.find(t => t.value === theme)?.description}
            </p>
          </div>

          {/* Additional Settings Sections */}
          <div style={{
            borderTop: '1px solid var(--color-border-light)',
            padding: 'var(--space-6)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-primary-text)',
              marginBottom: 'var(--space-4)'
            }}>
              General
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-primary-text)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    Language and region
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-secondary-text)'
                  }}>
                    English (United States)
                  </p>
                </div>
                <button style={{
                  color: 'var(--color-google-blue)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Change
                </button>
              </div>

              <div style={{
                borderTop: '1px solid var(--color-border-light)',
                paddingTop: 'var(--space-4)'
              }}>
                <TimezoneSelector inline={true} showLabel={true} />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border-light)'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-primary-text)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    Working hours
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-secondary-text)'
                  }}>
                    Set your availability schedule
                  </p>
                </div>
                <button
                  onClick={() => setShowWorkingHours(true)}
                  style={{
                    color: 'var(--color-google-blue)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Edit
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 'var(--space-2)'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-primary-text)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    Show weekends
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-secondary-text)'
                  }}>
                    Display Saturday and Sunday
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ display: 'none' }} defaultChecked />
                  <div style={{
                    width: '44px',
                    height: '24px',
                    background: 'var(--color-google-blue)',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'transform 0.2s'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div style={{
            borderTop: '1px solid var(--color-border-light)',
            padding: 'var(--space-6)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-primary-text)',
              marginBottom: 'var(--space-4)'
            }}>
              Notifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-primary-text)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    Desktop notifications
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-secondary-text)'
                  }}>
                    Get alerts for upcoming events
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ display: 'none' }} defaultChecked />
                  <div style={{
                    width: '44px',
                    height: '24px',
                    background: 'var(--color-google-blue)',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'transform 0.2s'
                    }}></div>
                  </div>
                </label>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-primary-text)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    Sound alerts
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-secondary-text)'
                  }}>
                    Play sound for notifications
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ display: 'none' }} />
                  <div style={{
                    width: '44px',
                    height: '24px',
                    background: 'var(--color-border-medium)',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'transform 0.2s'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWorkingHours && (
        <WorkingHours onClose={() => setShowWorkingHours(false)} />
      )}
    </div>
  );
}

export default SettingsModal;
