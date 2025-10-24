'use client';

import PricingCard from './PricingCard';
import { pricingPlans } from './pricingPlans';

export default function PricingGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {pricingPlans.map((plan, index) => (
        <PricingCard key={index} plan={plan} />
      ))}
    </div>
  );
}