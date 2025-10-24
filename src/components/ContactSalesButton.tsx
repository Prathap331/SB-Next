'use client';

import { Button } from '@/components/ui/button';

export default function ContactSalesButton() {
  return (
    <Button 
      variant="outline" 
      size="lg"
      onClick={() => console.log('Contact Sales clicked')}
    >
      Contact Sales
    </Button>
  );
}