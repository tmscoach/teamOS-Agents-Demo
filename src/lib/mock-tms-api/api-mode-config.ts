/**
 * API Mode Configuration
 * Controls switching between mock and live TMS API implementations
 */

export type APIMode = 'mock' | 'live';

export interface APIModeConfig {
  mode: APIMode;
  liveApiUrl?: string;
  mockDelay?: number;
  enableLogging?: boolean;
}

class APIModeManager {
  private static instance: APIModeManager;
  private config: APIModeConfig = {
    mode: 'mock',
    mockDelay: 100,
    enableLogging: true
  };

  private constructor() {
    // Load config from environment variables
    this.loadFromEnvironment();
  }

  static getInstance(): APIModeManager {
    if (!APIModeManager.instance) {
      APIModeManager.instance = new APIModeManager();
    }
    return APIModeManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    const mode = process.env.NEXT_PUBLIC_TMS_API_MODE as APIMode;
    if (mode === 'live' || mode === 'mock') {
      this.config.mode = mode;
    }

    if (process.env.NEXT_PUBLIC_TMS_API_URL) {
      this.config.liveApiUrl = process.env.NEXT_PUBLIC_TMS_API_URL;
    }

    if (process.env.NEXT_PUBLIC_TMS_MOCK_DELAY) {
      this.config.mockDelay = parseInt(process.env.NEXT_PUBLIC_TMS_MOCK_DELAY, 10);
    }

    if (process.env.NEXT_PUBLIC_TMS_API_LOGGING === 'false') {
      this.config.enableLogging = false;
    }
  }

  /**
   * Get current API mode
   */
  getMode(): APIMode {
    return this.config.mode;
  }

  /**
   * Set API mode
   */
  setMode(mode: APIMode): void {
    this.config.mode = mode;
    if (this.config.enableLogging) {
      console.log(`[TMS API] Switched to ${mode} mode`);
    }
  }

  /**
   * Get full configuration
   */
  getConfig(): APIModeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<APIModeConfig>): void {
    this.config = { ...this.config, ...updates };
    if (this.config.enableLogging) {
      console.log('[TMS API] Configuration updated:', this.config);
    }
  }

  /**
   * Check if in mock mode
   */
  isMockMode(): boolean {
    return this.config.mode === 'mock';
  }

  /**
   * Check if in live mode
   */
  isLiveMode(): boolean {
    return this.config.mode === 'live';
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl(): string {
    if (this.isLiveMode() && this.config.liveApiUrl) {
      return this.config.liveApiUrl;
    }
    // Mock API uses relative URLs
    return '';
  }

  /**
   * Log API activity (if enabled)
   */
  log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[TMS API ${this.config.mode.toUpperCase()}] ${message}`, data || '');
    }
  }
}

// Export singleton instance
export const apiModeManager = APIModeManager.getInstance();

/**
 * Environment variable configuration:
 * 
 * NEXT_PUBLIC_TMS_API_MODE = 'mock' | 'live'
 * NEXT_PUBLIC_TMS_API_URL = 'https://api.tms-global.com' (for live mode)
 * NEXT_PUBLIC_TMS_MOCK_DELAY = '100' (milliseconds)
 * NEXT_PUBLIC_TMS_API_LOGGING = 'true' | 'false'
 */