import React from 'react';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  helperText,
  errorMessage,
  required = false,
  children,
  className = '',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        width: '100%',
        ...style,
      }}
      className={`aage-form-field ${className}`.trim()}
    >
      {label && (
        <label
          htmlFor={htmlFor}
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {errorMessage ? (
        <span
          role="alert"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-danger)',
            fontWeight: 500,
            marginTop: '2px',
          }}
        >
          {errorMessage}
        </span>
      ) : helperText ? (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
