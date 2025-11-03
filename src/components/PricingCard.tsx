'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/client-components/button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/client-components/card';
import { Badge } from '@/components/client-components/badge';
import { Check, Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { processPayment } from '@/services/payment';
import { PricingPlan } from './pricingPlans';
import { toast } from 'sonner';

// Export PlanProps for backward compatibility
export interface PlanProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  buttonText: string;
  buttonVariant: 'outline' | 'default';
  popular: boolean;
  icon: LucideIcon;
}

interface PricingCardProps {
  plan: PricingPlan;
}

export default function PricingCard({ plan }: PricingCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const IconComponent = plan.icon;

  const handlePlanSelection = async () => {
    // Check if user is logged in first
    const token = localStorage.getItem('sb-xncfghdikiqknuruurfh-auth-token');
    if (!token) {
      toast.error('Authentication Required', {
        description: 'Please login to continue with subscription.',
        duration: 3000,
      });
      router.push('/auth');
      return;
    }

    // Free plan - redirect to home
    if (plan.amount === 0 || plan.targetTier === 'free') {
      router.push('/');
      return;
    }

    // Paid plans - initiate payment
    setIsProcessing(true);
    
    try {
      await processPayment(
        plan.amount,
        plan.targetTier,
        // Success handler
        (paymentId, orderId) => {
          console.log('Payment successful:', { paymentId, orderId });
          setIsProcessing(false);
          toast.success('Payment Successful!', {
            description: 'Your subscription will be activated shortly. You will receive a confirmation email.',
            duration: 5000,
          });
          // Redirect to profile after a short delay
          setTimeout(() => {
            router.push('/profile');
          }, 2000);
        },
        // Failure handler
        (error) => {
          console.error('Payment failed:', error);
          setIsProcessing(false);
          if (error !== 'Payment cancelled by user') {
            toast.error('Payment Failed', {
              description: error,
              duration: 5000,
            });
          }
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      console.error('Payment error:', errorMessage);
      setIsProcessing(false);
      toast.error('Payment Error', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };
  
  return (
    <Card
      className={`relative shadow-xl flex flex-col h-full ${
        plan.popular ? 'ring-2 ring-black scale-105' : ''
      }`}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black">
          Most Popular
        </Badge>
      )}

      {/* --- Header --- */}
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <IconComponent
            className={`w-12 h-12 ${
              plan.name === 'Free'
                ? 'text-black'
                : plan.name === 'Basic'
                ? 'text-black'
                : 'text-black'
            }`}
          />
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="mb-2">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-gray-600">{plan.period}</span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      {/* --- Content --- */}
      <CardContent className="flex flex-col flex-1">
        {/* --- Button (now above features) --- */}
        <Button
          className={`w-full mb-4 ${plan.popular ? 'bg-black' : ''}`}
          variant={plan.buttonVariant}
          onClick={handlePlanSelection}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            plan.buttonText
          )}
        </Button>

    {/* --- Features section --- */}
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2 text-black">What&apos;s included:</h4>
        <ul className="space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <Check className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </CardContent>
</Card>

  );
}