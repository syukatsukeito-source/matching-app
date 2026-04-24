import { ButtonHTMLAttributes, CSSProperties, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    border: variant === 'primary' ? 'none' : '1px solid #cbd5e1',
    background: variant === 'primary' ? '#0f172a' : '#ffffff',
    color: variant === 'primary' ? '#ffffff' : '#0f172a',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.6 : 1,
  };

  return (
    <button
      className={className}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
