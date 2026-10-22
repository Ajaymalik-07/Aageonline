'use client';

import React from 'react';
import { MotionReveal } from './MotionReveal.ts';
import { useReducedMotion } from './useReducedMotion.ts';
import { getStaggerDelay } from '../../lib/motion/tokens.ts';

export interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerIntervalMs?: number;
  baseDelayMs?: number;
  children: React.ReactNode;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  staggerIntervalMs = 60,
  baseDelayMs = 0,
  children,
  className = '',
  style,
  ...props
}) => {
  const childArray = React.Children.toArray(children);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`aage-stagger-container ${className}`.trim()} style={style} {...props}>
      {childArray.map((child, index) => (
        <MotionReveal
          key={index}
          delayMs={prefersReducedMotion ? 0 : baseDelayMs + getStaggerDelay(index, 6, staggerIntervalMs)}
          staggerIndex={index}
        >
          {child}
        </MotionReveal>
      ))}
    </div>
  );
};
