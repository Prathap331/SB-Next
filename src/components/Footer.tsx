import { Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white py-12 mt-16">
      <div className="container mx-auto px-16">
        <div className="flex flex-col md:flex-row justify-around gap-12">
          {/* Company Details */}
          <div className="flex-1 min-w-[200px]">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Image
                src="/White logo.png"
                alt="Storybit"
                width={128}
                height={32}
                className="mb-4 h-8 w-auto"
                style={{ width: 'auto' }}
              />
            </Link>
            <p className="text-gray-300 mb-4">
              Revolutionary AI-powered scriptwriting platform for content creators worldwide.
            </p>
            <div className="text-gray-400 text-sm">
              <p>© 2025 Morpho Technologies Pvt Ltd.<br /> All rights reserved.</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex-1 min-w-[200px]">
            <h4 className="text-lg font-semibold mb-4">Address</h4>
            <div className="text-gray-300 space-y-2">
              <p>Plot no. MIG 891,</p>
              <p>KPHB Phase 3, Kukatpally,</p>
              <p>Hyderabad, Telangana,</p>
              <p>India - 500072</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex-1 min-w-[200px]">
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <a href="mailto:support@storybit.tech" className="flex items-center space-x-2 text-gray-300 hover:text-white">
                <Mail className="w-4 h-4" />
                <span>support@storybit.tech</span>
              </a>
              <a href="tel:+919000449855" className="flex items-center space-x-2 text-gray-300 hover:text-white">
                <Phone className="w-4 h-4" />
                <span>+91 90004 49855</span>
              </a>
              {/* <div className="flex items-center space-x-2 text-gray-300">
                <MessageCircle className="w-4 h-4" />
                <span>+1 (555) 987-6543</span>
              </div> */}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex-1 min-w-[200px]">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/terms-and-conditions" className="block text-gray-300 hover:text-white">Terms and conditions</Link>
              <Link href="/privacy-policy" className="block text-gray-300 hover:text-white">Privacy policy</Link>
              <Link href="/cancellation-and-refund-policy" className="block text-gray-300 hover:text-white">Cancellation & Refund policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
