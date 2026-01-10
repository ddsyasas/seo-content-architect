'use client';

import { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';

declare global {
    interface Window {
        hcaptcha?: {
            render: (container: string | HTMLElement, options: object) => string;
            reset: (widgetId?: string) => void;
            getResponse: (widgetId?: string) => string;
        };
        onHCaptchaLoad?: () => void;
    }
}

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaWidgetId, setCaptchaWidgetId] = useState<string | null>(null);
    const [hcaptchaLoaded, setHcaptchaLoaded] = useState(false);

    const renderCaptcha = useCallback(() => {
        if (window.hcaptcha && !captchaWidgetId) {
            const widgetId = window.hcaptcha.render('hcaptcha-container', {
                sitekey: HCAPTCHA_SITE_KEY,
                callback: (token: string) => setCaptchaToken(token),
                'expired-callback': () => setCaptchaToken(''),
                'error-callback': () => setCaptchaToken(''),
            });
            setCaptchaWidgetId(widgetId);
        }
    }, [captchaWidgetId]);

    useEffect(() => {
        window.onHCaptchaLoad = () => {
            setHcaptchaLoaded(true);
        };

        // If hcaptcha is already loaded
        if (window.hcaptcha) {
            setHcaptchaLoaded(true);
        }

        return () => {
            window.onHCaptchaLoad = undefined;
        };
    }, []);

    useEffect(() => {
        if (hcaptchaLoaded && !isSubmitted) {
            renderCaptcha();
        }
    }, [hcaptchaLoaded, isSubmitted, renderCaptcha]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!captchaToken) {
            setError('Please complete the captcha verification');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    captchaToken,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            setIsSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            setCaptchaToken('');
            setCaptchaWidgetId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
            if (window.hcaptcha && captchaWidgetId) {
                window.hcaptcha.reset(captchaWidgetId);
            }
            setCaptchaToken('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSendAnother = () => {
        setIsSubmitted(false);
        setCaptchaWidgetId(null);
        setTimeout(() => {
            if (window.hcaptcha) {
                renderCaptcha();
            }
        }, 100);
    };

    return (
        <MarketingLayout>
            <Script
                src="https://js.hcaptcha.com/1/api.js?onload=onHCaptchaLoad&render=explicit"
                async
                defer
            />

            {/* Hero */}
            <section className="py-16 md:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Have a question or want to learn more about SyncSEO? We&apos;d love to hear from you.
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                            <p className="text-gray-600 mb-8">
                                Reach out to us through any of the following channels. We typically respond within 24 hours.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Email</h3>
                                        <a href="mailto:hi@syncseo.io" className="text-indigo-600 hover:text-indigo-700">
                                            hi@syncseo.io
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Phone className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Phone</h3>
                                        <a href="tel:+393884095330" className="text-indigo-600 hover:text-indigo-700">
                                            +39 388 409 5330
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                        <MapPin className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Address</h3>
                                        <p className="text-gray-600">
                                            Via del Carpentiere, 32 unit 7<br />
                                            40138 BOLOGNA BO<br />
                                            Italy
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Business Hours */}
                            <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
                                <p className="text-gray-600 text-sm">
                                    Monday - Friday: 9:00 AM - 6:00 PM (CET)<br />
                                    Saturday - Sunday: Closed
                                </p>
                            </div>

                            {/* Where messages go info */}
                            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <p className="text-sm text-indigo-800">
                                    <strong>Note:</strong> Messages submitted through this form are sent directly to our support team at hi@syncseo.io
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-600 mb-6">
                                        Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={handleSendAnother}
                                    >
                                        Send Another Message
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject
                                        </label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="">Select a topic</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Sales Question">Sales Question</option>
                                            <option value="Technical Support">Technical Support</option>
                                            <option value="Partnership">Partnership</option>
                                            <option value="Feedback">Feedback</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Message <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none placeholder:text-gray-400"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    {/* hCaptcha Widget */}
                                    <div className="flex justify-center">
                                        <div id="hcaptcha-container" />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !captchaToken}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-gray-500 text-center">
                                        By submitting this form, you agree to our{' '}
                                        <a href="/legal/privacy-policy" className="text-indigo-600 hover:underline">
                                            Privacy Policy
                                        </a>.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
