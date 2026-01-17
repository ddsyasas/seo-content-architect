'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const POPUP_DELAY_MS = 8000; // 8 seconds after scroll
const COOLDOWN_HOURS = 24; // Don't show for 24 hours after close
const STORAGE_KEY_CLOSED = 'newsletter_popup_closed_at';
const STORAGE_KEY_SUBSCRIBED = 'newsletter_subscribed';

export function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  // Check if popup should be shown
  const shouldShowPopup = useCallback(() => {
    // Don't show if logged in
    if (isLoggedIn) return false;

    // Don't show if already subscribed
    if (localStorage.getItem(STORAGE_KEY_SUBSCRIBED) === 'true') return false;

    // Don't show if closed within cooldown period
    const closedAt = localStorage.getItem(STORAGE_KEY_CLOSED);
    if (closedAt) {
      const closedTime = parseInt(closedAt, 10);
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (Date.now() - closedTime < cooldownMs) return false;
    }

    return true;
  }, [isLoggedIn]);

  // Handle scroll and timer
  useEffect(() => {
    // Wait for auth check
    if (isLoggedIn === null) return;

    if (!shouldShowPopup()) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let hasScrolled = false;

    const handleScroll = () => {
      if (hasScrolled) return;
      hasScrolled = true;

      // Start timer after scroll
      timeoutId = setTimeout(() => {
        if (shouldShowPopup()) {
          setIsVisible(true);
        }
      }, POPUP_DELAY_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoggedIn, shouldShowPopup]);

  const handleClose = () => {
    setIsClosing(true);
    // Save close time
    localStorage.setItem(STORAGE_KEY_CLOSED, Date.now().toString());
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Thanks for subscribing!' });
        localStorage.setItem(STORAGE_KEY_SUBSCRIBED, 'true');
        // Close popup after success
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl mb-4">
            <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Get SEO Insights Weekly
          </h3>

          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
            Join 1,000+ SEO professionals getting content architecture tips, internal linking strategies, and best practices.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          {message && (
            <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message.text}
            </p>
          )}

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Unsubscribe anytime. No spam, we promise.
          </p>
        </div>
      </div>
    </div>
  );
}
