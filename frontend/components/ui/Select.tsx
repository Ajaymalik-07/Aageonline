import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  errorMessage?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  errorMessage,
  id,
  className = '',
  style,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <select
          id={selectId}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : helperText ? helperId : undefined}
          style={{
            minHeight: '44px',
            padding: '10px 36px 10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${errorMessage ? 'var(--color-danger)' : 'var(--border-strong)'}`,
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-base)',
            outline: 'none',
            transition: 'border-color var(--motion-fast)',
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            ...style,
          }}
          className={`aage-select ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Accessible dropdown chevron */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-secondary)',
            fontSize: '12px',
          }}
        >
          ▼
        </span>
      </div>
      {errorMessage ? (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: 'var(--font-size-xs)',
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
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
