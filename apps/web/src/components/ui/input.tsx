import { CSSProperties, InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
  const inputStyle: CSSProperties = {
    width: '100%',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    padding: '12px 16px',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <label style={{ display: 'grid', gap: 8, fontSize: 14, fontWeight: 500, color: '#334155' }}>
      <span>{label}</span>
      <input
        className={className}
        style={inputStyle}
        {...props}
      />
      {error ? <span style={{ fontSize: 12, color: '#e11d48' }}>{error}</span> : null}
    </label>
  );
}
