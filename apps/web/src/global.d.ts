declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Google Tag Manager / gtag.js
interface Window {
  gtag: {
    (
      command: 'consent' | 'config' | 'event' | 'js',
      target: string | Date,
      params?: Record<string, unknown>,
    ): void;
    (command: 'set', field: string, value: unknown): void;
  };
  dataLayer: unknown[];
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}
