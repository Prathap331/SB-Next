'use client';

import Link from 'next/link';
import { Button } from '@/components/client-components/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundNavigation() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/">
        <Button className="flex items-center">
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </Link>
      <Button variant="outline" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Go Back
      </Button>
    </div>
  );
}