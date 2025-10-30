"use client";

import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, Crown } from 'lucide-react';

export default function Profile() {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('sb-xncfghdikiqknuruurfh-auth-token');
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-[#E9EBF0]/20">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Your{' '}
              <span className="bg-black text-white px-2 py-1 rounded text-4xl md:text-5xl font-semibold">
                Profile
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Manage your account settings and subscription
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">John Doe</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">john.doe@example.com</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-gray-900">January 2024</p>
                </div>
                <Button className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Your current plan and usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Plan</label>
                  <p className="text-gray-900 font-semibold">Basic Plan - $15/month</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Scripts Generated</label>
                  <p className="text-gray-900">247 / 500 minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Next Billing</label>
                  <p className="text-gray-900">March 15, 2024</p>
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1">
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Actions */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="text-black-600 hover:text-black-800 hover:bg-black-50"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
