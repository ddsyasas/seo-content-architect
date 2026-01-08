'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncseo.io';
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${baseUrl}/reset-password`,
            });

            if (error) throw error;

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
                <p className="text-gray-600 mb-6">
                    We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            setIsSuccess(false);
                            setEmail('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Try a different email
                    </button>
                    <Link
                        href="/login"
                        className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
                <p className="text-gray-600 mt-2">
                    No worries, we'll send you reset instructions.
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>
            </div>
        </div>
    );
}
