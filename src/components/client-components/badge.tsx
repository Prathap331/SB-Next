'use client';

import { Badge as BaseBadge } from '@/components/ui/badge';
import { ComponentProps } from 'react';

export function Badge(props: ComponentProps<typeof BaseBadge>) {
  return <BaseBadge {...props} />;
}

export default Badge;