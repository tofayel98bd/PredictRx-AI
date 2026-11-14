import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for responsive/theme hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for Recharts
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock SpeechSynthesis for Bangla Patient Companion TTS
class MockSpeechSynthesisUtterance {
  lang: string = '';
  rate: number = 1;
  text: string = '';
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text?: string) {
    this.text = text || '';
  }
}

globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;

if (typeof window !== 'undefined') {
  window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;
  window.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    speaking: false,
    paused: false,
    pending: false,
    onvoiceschanged: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as SpeechSynthesis;
}
