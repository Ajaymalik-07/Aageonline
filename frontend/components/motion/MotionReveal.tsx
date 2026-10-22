'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.ts';

export interface MotionRevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'span' | 'header' | 'footer';
  delayMs?: number;
  staggerIndex?: number;
  durationMs?: number;
  threshold?: number;
  role?: string;
  children: React.ReactNode;
}

export const MotionReveal: React.FC<MotionRevealProps> = ({
  as: Component = 'div',
  delayMs = 0,
  staggerIndex,
  durationMs = 380,
  threshold = 0.1,
  className = '',
  style,
  children,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const elementRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const computedDelay = staggerIndex !== undefined ? staggerIndex * 60 : delayMs;

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [prefersReducedMotion, threshold]);

  const baseStyle: React.CSSProperties = prefersReducedMotion
    ? { ...style }
    : {
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'translateY(0)' : 'translateY(12px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${computedDelay}ms`,
        willChange: isRevealed ? 'auto' : 'opacity, transform',
        ...style,
      };

  return React.createElement(
    Component,
    {
      ref: elementRef,
      className: `aage-motion-reveal ${isRevealed ? 'is-revealed' : ''} ${className}`.trim(),
      style: baseStyle,
      ...props,
    },
    children
  );
};
