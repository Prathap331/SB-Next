'use client';

import { PlanProps } from './PricingCard';
import { Crown, Zap, Target } from 'lucide-react';

export interface PricingPlan extends PlanProps {
  amount: number; // Amount in INR
  targetTier: string; // Tier identifier for API
}

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'One-time',
    description: 'Perfect for trying out our AI scriptwriting',
    features: [
      '100 minutes of script generation',
      'Basic analysis depth',
      'Standard latency (30-60 seconds)',
      'Basic templates',
      'Community support'
    ],
    limitations: [
      'One-time use per user',
      'Limited customization',
      'No priority support'
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const,
    popular: false,
    icon: Target,
    amount: 0,
    targetTier: 'free'
  },
  {
    name: 'Basic',
    price: '$15',
    period: '/month',
    description: 'Great for regular content creators',
    features: [
      '500 minutes of script generation',
      'Enhanced analysis depth',
      'Fast latency (15-30 seconds)',
      'Advanced templates',
      'Priority email support',
      'Export options',
      'Custom branding'
    ],
    limitations: [],
    buttonText: 'Choose Basic',
    buttonVariant: 'default' as const,
    popular: true,
    icon: Zap,
    amount: 100, // ~$15 in INR (assuming ~83 INR per USD)
    targetTier: 'basic'
  },
  {
    name: 'Pro',
    price: '$25',
    period: '/month',
    description: 'For professional content creators and teams',
    features: [
      'Unlimited script generation',
      'Premium analysis depth',
      'Ultra-fast latency (5-15 seconds)',
      'Premium templates & customization',
      '24/7 priority support',
      'Advanced export options',
      'Team collaboration',
      'API access',
      'Custom integrations'
    ],
    limitations: [],
    buttonText: 'Choose Pro',
    buttonVariant: 'default' as const,
    popular: false,
    icon: Crown,
    amount: 100, // ~$25 in INR (assuming ~83 INR per USD)
    targetTier: 'pro'
  }
];