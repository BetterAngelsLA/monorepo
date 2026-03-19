import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

export interface IModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: IModalFooterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollEl = container.previousElementSibling as HTMLElement | null;
    if (!scrollEl) return;

    const checkScroll = () => {
      const canScrollDown =
        scrollEl.scrollHeight > scrollEl.clientHeight &&
        scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 1;
      setShowFade(canScrollDown);
    };

    checkScroll();
    scrollEl.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(scrollEl);

    return () => {
      scrollEl.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <div
        className={mergeCss([
          'absolute',
          '-top-12',
          'left-0',
          'right-0',
          'h-12',
          'bg-gradient-to-t',
          'from-white',
          'via-white/70',
          'to-transparent',
          'pointer-events-none',
          showFade ? 'opacity-100' : 'opacity-0',
        ])}
      />
      <div
        className={mergeCss([
          'flex',
          'items-center',
          'justify-end',
          'gap-3',
          'p-6',
          'pt-4',
          className,
        ])}
      >
        {children}
      </div>
    </div>
  );
}
