import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button data-variant={variant} {...props} />;
}

export function Card({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <article style={{ border: '1px solid rgba(224, 173, 99, 0.28)', borderRadius: 8, padding: 20, maxWidth: 320 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p>{children}</p>
    </article>
  );
}
