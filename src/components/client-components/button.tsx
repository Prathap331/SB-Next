'use client';

import { Button as BaseButton } from '@/components/ui/button';
import { ComponentProps } from 'react';

export function Button(props: ComponentProps<typeof BaseButton>) {
  return <BaseButton {...props} />;
}

export default Button;