"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiModeManager, APIMode } from "@/src/lib/mock-tms-api/api-mode-config";
import { toast } from "sonner";
import { ToggleLeft, ToggleRight, Server, Database, Info, Save } from "lucide-react";

export default function APIModeConfigPage() {
  const { userId } = useAuth();
  const [apiMode, setApiMode] = useState<APIMode>('mock');
  const [liveApiUrl, setLiveApiUrl] = useState('');
  const [mockDelay, setMockDelay] = useState(100);
  const [enableLogging, setEnableLogging] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current configuration
    const config = apiModeManager.getConfig();
    setApiMode(config.mode);
    setLiveApiUrl(config.liveApiUrl || '');
    setMockDelay(config.mockDelay || 100);
    setEnableLogging(config.enableLogging !== false);
  }, []);

  const handleModeToggle = () => {
    const newMode = apiMode === 'mock' ? 'live' : 'mock';
    setApiMode(newMode);
    apiModeManager.setMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      apiModeManager.updateConfig({
        mode: apiMode,
        liveApiUrl,
        mockDelay,
        enableLogging
      });

      // Persist to server if needed
      await fetch('/api/admin/api-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: apiMode,
          liveApiUrl,
          mockDelay,
          enableLogging
        })
      });

      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div>Please sign in to access this page</div>;
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>
          API Mode Configuration
        </h2>
        <p style={{ color: '#6b7280' }}>
          Configure the TMS API to use mock or live implementation
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Server style={{ width: '20px', height: '20px' }} />
          API Mode
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <p style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#111827',
              marginBottom: '4px'
            }}>
              Current Mode: <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: apiMode === 'mock' ? '#dbeafe' : '#d1fae5',
                color: apiMode === 'mock' ? '#1e40af' : '#065f46',
                fontWeight: '600'
              }}>{apiMode.toUpperCase()}</span>
            </p>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {apiMode === 'mock' 
                ? 'Using local mock implementation with simulated data'
                : 'Using live TMS Global API endpoints'}
            </p>
          </div>

          <button
            onClick={handleModeToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#111827',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {apiMode === 'mock' ? <ToggleLeft style={{ width: '20px', height: '20px' }} /> : <ToggleRight style={{ width: '20px', height: '20px' }} />}
            Switch to {apiMode === 'mock' ? 'Live' : 'Mock'}
          </button>
        </div>
      </div>

      {/* Live API Configuration */}
      {apiMode === 'live' && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Live API Configuration
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              API Base URL
            </label>
            <input
              type="text"
              value={liveApiUrl}
              onChange={(e) => setLiveApiUrl(e.target.value)}
              placeholder="https://api.tms-global.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px'
            }}>
              Enter the base URL for the TMS Global API
            </p>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
            <Info style={{ width: '16px', height: '16px', color: '#92400e', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '13px', color: '#92400e' }}>
              Live mode requires valid TMS Global API credentials. Make sure authentication tokens are properly configured.
            </p>
          </div>
        </div>
      )}

      {/* Mock API Configuration */}
      {apiMode === 'mock' && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Database style={{ width: '20px', height: '20px' }} />
            Mock API Configuration
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Response Delay (ms)
            </label>
            <input
              type="number"
              value={mockDelay}
              onChange={(e) => setMockDelay(parseInt(e.target.value) || 0)}
              min="0"
              max="5000"
              style={{
                width: '150px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px'
            }}>
              Simulate network latency (0-5000ms)
            </p>
          </div>
        </div>
      )}

      {/* Logging Configuration */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Debug Settings
        </h3>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={enableLogging}
            onChange={(e) => setEnableLogging(e.target.checked)}
            style={{
              width: '16px',
              height: '16px'
            }}
          />
          <span style={{
            fontSize: '14px',
            color: '#374151'
          }}>
            Enable API logging to console
          </span>
        </label>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveConfig}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#111827',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1
        }}
      >
        <Save style={{ width: '16px', height: '16px' }} />
        {loading ? 'Saving...' : 'Save Configuration'}
      </button>

      {/* Environment Variables Info */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Environment Variables
        </h4>
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px'
        }}>
          You can also configure these settings using environment variables:
        </p>
        <pre style={{
          fontSize: '11px',
          color: '#374151',
          backgroundColor: '#f3f4f6',
          padding: '8px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`NEXT_PUBLIC_TMS_API_MODE=mock|live
NEXT_PUBLIC_TMS_API_URL=https://api.tms-global.com
NEXT_PUBLIC_TMS_MOCK_DELAY=100
NEXT_PUBLIC_TMS_API_LOGGING=true|false`}
        </pre>
      </div>
    </div>
  );
}