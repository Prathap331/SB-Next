"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Crown, User, Menu } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto lg:px-16 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image
              src="/Logo.png"
              alt="Storybit"
              width={192}
              height={48}
              className="h-8 sm:h-9 md:h-10 lg:h-12 w-auto max-w-full"
              style={{ width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="outline" className="flex items-center">
                <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                Upgrade
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="outline" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/80 backdrop-blur-md">
          <div className="container mx-auto lg:px-16 py-4 flex flex-col space-y-4">
            <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start flex items-center">
                <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                Upgrade
              </Button>
            </Link>
            <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Sign In</Button>
            </Link>
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start flex items-center">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
