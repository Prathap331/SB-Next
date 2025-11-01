'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // ✅ ensure this file exists and exports a Supabase client
import { ApiService } from '@/services/api';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  // ✅ Typed input change handler
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // ✅ Fixed async auth logic
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ text: 'Passwords do not match.', type: 'error' });
          return;
        }

        await ApiService.signUp({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
        });

        setMessage({ text: '✅ Sign up successful! Check your email to confirm.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        setMessage({ text: '✅ Sign in successful!', type: 'success' });
        router.back();
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setMessage({ text: message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Sign-in failed.';
      setMessage({ text: message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CSS utility strings
  const inputStyles =
    'block w-full pl-10 pr-4 py-2 border border-gray-300 bg-[#E9EBF0]/20 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm';
  const buttonStyles =
    'w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50';
  const googleButtonStyles =
    'w-full py-3 flex items-center justify-center space-x-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50';

  return (
    <div className="shadow-xl border-0 bg-white backdrop-blur-sm max-w-md mx-auto mt-8 rounded-lg">
      <div className="text-center p-6">
        <h2 className="text-2xl font-bold">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isSignUp
            ? 'Sign up to start creating amazing video scripts'
            : 'Sign in to your account to continue'}
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={googleButtonStyles}
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or</span>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <p
            className={`text-sm text-center ${
              message.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputStyles}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className={inputStyles}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {isSignUp && (
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className={buttonStyles} disabled={isLoading}>
            {isLoading
              ? 'Processing...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage({ text: '', type: '' });
              }}
              className="ml-1 text-black font-medium hover:underline"
              disabled={isLoading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {!isSignUp && (
          <div className="text-center">
            <Link
              href="/forgot-password"
              className={`text-sm text-black hover:underline ${
                isLoading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
