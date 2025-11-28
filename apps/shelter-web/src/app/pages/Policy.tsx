import { HorizontalLayout } from '@monorepo/layout/horizontalLayout';
import { useEffect } from 'react';

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    name?: string;
  }
}

export function Policy() {
  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'termly-jssdk';
    script.src = 'https://app.termly.io/embed-policy.min.js';
    script.async = true;
    script.onload = () => console.log('Termly script loaded successfully.');
    script.onerror = () => console.error('Failed to load the Termly script.');
    document.body.appendChild(script);
  }, []);

  return (
    <HorizontalLayout>
      <div
        className="w-full"
        name="termly-embed"
        data-id="289dda2d-120b-4304-abfd-a7deaa4abd14"
      ></div>
    </HorizontalLayout>
  );
}
