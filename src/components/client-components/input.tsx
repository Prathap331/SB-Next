'use client';

import { Input as BaseInput } from '@/components/ui/input';
import { ComponentProps } from 'react';

export function Input(props: ComponentProps<typeof BaseInput>) {
  return <BaseInput {...props} />;
}

export default Input;