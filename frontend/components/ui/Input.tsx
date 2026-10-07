import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  id,
  className = '',
  style,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : helperText ? helperId : undefined}
        style={{
          minHeight: '44px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${errorMessage ? 'var(--color-danger)' : 'var(--border-strong)'}`,
          backgroundColor: 'var(--surface-card)',
          color: 'var(--text-primary)',
          fontSize: '16px',
          outline: 'none',
          transition: 'border-color var(--motion-fast)',
          width: '100%',
          ...style,
        }}
        className={`aage-input ${className}`}
        {...props}
      />
      {errorMessage ? (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: '13px',
            color: 'var(--color-danger)',
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </span>
      ) : helperText ? (
        <span
          id={helperId}
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
