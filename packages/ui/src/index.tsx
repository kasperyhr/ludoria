import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button data-slot="button" data-variant={variant} {...props} />;
}

export function Card({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <article data-slot="card" {...props}>
      {children}
    </article>
  );
}

type BadgeProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement> & {
  variant?: 'neutral' | 'success' | 'danger';
}>;

export function Badge({ variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" data-variant={variant} {...props}>
      {children}
    </span>
  );
}
