'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Mail, Users, ArrowRight, LogIn } from 'lucide-react';

interface InvitationDetails {
    id: string;
    email: string;
    role: string;
    expires_at: string;
    projects: {
        name: string;
        domain: string | null;
    };
    inviter: {
        full_name: string | null;
        email: string;
    };
}

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [emailMismatch, setEmailMismatch] = useState<{ invited: string; current: string } | null>(null);

    useEffect(() => {
        fetchInvitation();
    }, [token]);

    const fetchInvitation = async () => {
        try {
            const response = await fetch(`/api/invitations/${token}`);
            const data = await response.json();

            if (response.status === 404) {
                setError('This invitation link is invalid or not found.');
            } else if (response.status === 410) {
                setError(data.error || 'This invitation has expired or already been used.');
            } else if (response.ok) {
                setInvitation(data.invitation);
            } else {
                setError(data.error || 'Failed to load invitation');
            }
        } catch (err) {
            setError('Failed to load invitation details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        setIsAccepting(true);
        setError(null);

        try {
            const response = await fetch(`/api/invitations/${token}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.status === 401) {
                setNeedsAuth(true);
            } else if (response.status === 403 && data.invitedEmail) {
                setEmailMismatch({
                    invited: data.invitedEmail,
                    current: data.currentEmail,
                });
            } else if (response.ok) {
                setSuccess(true);
                // Redirect to project after short delay
                setTimeout(() => {
                    router.push(`/project/${data.projectId}`);
                }, 2000);
            } else {
                setError(data.error || 'Failed to accept invitation');
            }
        } catch (err) {
            setError('Failed to accept invitation');
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading invitation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Invitation Error
                        </h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome to the team! 🎉
                        </h1>
                        <p className="text-gray-600 mb-4">
                            You&apos;ve successfully joined <strong>{invitation?.projects?.name || 'the project'}</strong>
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting to project...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (needsAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LogIn className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Sign in to continue
                        </h1>
                        <p className="text-gray-600 mb-6">
                            You need to sign in or create an account to accept this invitation.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href={`/login?redirect=/invite/${token}`}
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Sign In
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/signup?redirect=/invite/${token}`}
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (emailMismatch) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Email mismatch
                        </h1>
                        <p className="text-gray-600 mb-6">
                            This invitation was sent to <strong>{emailMismatch.invited}</strong>,
                            but you&apos;re signed in as <strong>{emailMismatch.current}</strong>.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Sign in with different account
                            </Link>
                            <Link
                                href="/dashboard"
                                className="block text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const roleLabels: Record<string, string> = {
        admin: 'Admin - Can manage project and team',
        editor: 'Editor - Can create and edit content',
        viewer: 'Viewer - Read-only access',
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-indigo-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        You&apos;re invited!
                    </h1>

                    <p className="text-gray-600 text-center mb-6">
                        <strong>{invitation?.inviter?.full_name || invitation?.inviter?.email || 'Someone'}</strong> has
                        invited you to collaborate on:
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h2 className="font-semibold text-gray-900 text-lg mb-1">
                            {invitation?.projects?.name || 'a project'}
                        </h2>
                        {invitation?.projects?.domain && (
                            <p className="text-sm text-gray-500">{invitation.projects.domain}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Your role:</span>{' '}
                                {roleLabels[invitation?.role || 'viewer']}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isAccepting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Accept Invitation
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        By accepting, you&apos;ll be able to access this project based on your assigned role.
                    </p>
                </div>
            </div>
        </div>
    );
}
