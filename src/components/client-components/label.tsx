'use client';

import { Label as BaseLabel } from '@/components/ui/label';
import { ComponentProps } from 'react';

export function Label(props: ComponentProps<typeof BaseLabel>) {
  return <BaseLabel {...props} />;
}

export default Label;