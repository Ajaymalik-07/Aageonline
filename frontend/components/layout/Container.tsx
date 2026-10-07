import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

export function Container({ children, as: Component = 'div', className = '', style, ...props }: ContainerProps) {
  return (
    <Component
      className={`container ${className}`.trim()}
      style={{
        width: '100%',
        maxWidth: '1280px',
        marginLeft: 'auto',
        marginRight: 'auto',
        overflowX: 'clip',
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
