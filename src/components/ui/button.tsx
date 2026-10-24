import type { ComponentProps } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

export function Button({
  variant = 'primary',
  type = 'button',
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; asChild?: never }) {
  return <button type={type} data-variant={variant} {...rest} />;
}

export function LinkButton({
  variant = 'primary',
  ...rest
}: ComponentProps<'a'> & { variant?: Variant }) {
  return <a data-variant={variant} {...rest} />;
}
