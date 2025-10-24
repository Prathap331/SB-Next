'use client';

import { Separator as BaseSeparator } from '@/components/ui/separator';
import { ComponentProps } from 'react';

export function Separator(props: ComponentProps<typeof BaseSeparator>) {
  return <BaseSeparator {...props} />;
}

export default Separator;