declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Google Tag Manager / gtag.js
interface Window {
  gtag: (
    command: 'consent' | 'config' | 'event' | 'js' | 'set',
    target: string | Date,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>,
  ) => void;
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
