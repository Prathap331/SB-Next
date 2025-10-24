'use client';

'use client';

import { Button } from '@/components/client-components/button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/client-components/card';
import { Badge } from '@/components/client-components/badge';
import { Check } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

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
  plan: PlanProps;
}

export default function PricingCard({ plan }: PricingCardProps) {
  const IconComponent = plan.icon;
  
  return (
    <Card className={`relative shadow-xl ${plan.popular ? 'ring-2 ring-black scale-105' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <IconComponent className={`w-12 h-12 ${plan.name === 'Free' ? 'text-black' : plan.name === 'Basic' ? 'text-black' : 'text-black'}`} />
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="mb-2">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-gray-600">{plan.period}</span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-black">What&apos;s included:</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="w-5 h-5 text-grey-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Button 
            className={`w-full ${plan.popular ? 'bg-black' : ''}`}
            variant={plan.buttonVariant}
            onClick={() => console.log(`Selected ${plan.name} plan`)}
          >
            {plan.buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}