// Type definitions for Google Analytics gtag.js
interface Window {
  gtag: (
    command: 'config' | 'event' | 'set' | 'consent' | 'js',
    targetId: string,
    config?: {
      [key: string]: any;
    }
  ) => void;
  dataLayer: any[];
}

// Google Analytics Event
interface GTagEvent {
  action: string;
  category: string;
  label: string;
  value?: number;
}
