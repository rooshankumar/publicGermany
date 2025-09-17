import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global console sanitizer: suppress noisy dev logs and redact sensitive info
(() => {
  const original = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    warn: console.warn,
    error: console.error,
  } as const;

  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const suppressPatterns: RegExp[] = [
    /^\[vite\]/i,
    /Download the React DevTools/i,
    /React Router Future Flag Warning/i,
    /@vercel\/analytics.*Debug mode is enabled/i,
    /\[Vercel Web Analytics\]/i,
  ];

  const shouldSuppress = (args: unknown[]): boolean => {
    const first = args[0];
    if (typeof first === 'string') {
      return suppressPatterns.some((re) => re.test(first));
    }
    return false;
  };

  const redact = (args: unknown[]): unknown[] =>
    args.map((a) =>
      typeof a === 'string' ? a.replace(emailRegex, '[REDACTED_EMAIL]') : a
    );

  console.log = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    original.log.apply(console, redact(args) as any);
  };
  console.info = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    original.info.apply(console, redact(args) as any);
  };
  console.debug = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    original.debug.apply(console, redact(args) as any);
  };
  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    original.warn.apply(console, redact(args) as any);
  };
  // Keep errors, but redact PII
  console.error = (...args: unknown[]) => {
    original.error.apply(console, redact(args) as any);
  };
})();

createRoot(document.getElementById("root")!).render(<App />);
