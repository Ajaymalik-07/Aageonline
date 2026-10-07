import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'spotlight';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  isError = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 600,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    transition: 'all var(--motion-fast)',
    border: '1px solid transparent',
    textDecoration: 'none',
    minHeight: '44px', // 44px accessible touch target
    minWidth: '44px',
    opacity: disabled ? 0.5 : 1,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 24px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' },
  };

  const getVariantStyles = (): React.CSSProperties => {
    if (isSuccess) {
      return {
        backgroundColor: 'var(--color-success)',
        color: '#ffffff',
      };
    }
    if (isError) {
      return {
        backgroundColor: 'var(--color-danger)',
        color: '#ffffff',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--action-primary)',
          color: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--brand-deep-navy)',
          color: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-strong)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
        };
      case 'spotlight':
        return {
          backgroundColor: 'var(--brand-lime)',
          color: 'var(--brand-deep-navy)',
          fontWeight: 700,
        };
    }
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...getVariantStyles(),
      }}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`aage-button ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          <span>Processing...</span>
        </>
      ) : isSuccess ? (
        <>
          <span>✓</span>
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
