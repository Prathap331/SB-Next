'use client';

import { Card as BaseCard, CardContent as BaseCardContent, CardDescription as BaseCardDescription, CardHeader as BaseCardHeader, CardTitle as BaseCardTitle } from '@/components/ui/card';
import { ComponentProps } from 'react';

function Card(props: ComponentProps<typeof BaseCard>) {
  return <BaseCard {...props} />;
}

function CardContent(props: ComponentProps<typeof BaseCardContent>) {
  return <BaseCardContent {...props} />;
}

function CardDescription(props: ComponentProps<typeof BaseCardDescription>) {
  return <BaseCardDescription {...props} />;
}

function CardHeader(props: ComponentProps<typeof BaseCardHeader>) {
  return <BaseCardHeader {...props} />;
}

function CardTitle(props: ComponentProps<typeof BaseCardTitle>) {
  return <BaseCardTitle {...props} />;
}

export {
  Card as default,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
};