/**
 * Scroll Performance & Layout Stability Utilities.
 * Enforces smooth 60fps scrolling and prevents Cumulative Layout Shift (CLS).
 */

/**
 * Creates an event listener with passive: true by default to ensure scroll threads are never blocked.
 */
export function addPassiveScrollListener(
  target: Window | HTMLElement,
  callback: (e: Event) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let ticking = false;

  const onScroll = (e: Event) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback(e);
        ticking = false;
      });
      ticking = true;
    }
  };

  target.addEventListener('scroll', onScroll, { passive: true });
  return () => target.removeEventListener('scroll', onScroll);
}

/**
 * Accessible Modal Scroll Lock that avoids layout shifting by preserving scrollbar width.
 */
export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  const originalOverflow = document.body.style.overflow;
  const originalPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  };
}

/**
 * Explicit unlock scroll helper.
 */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

