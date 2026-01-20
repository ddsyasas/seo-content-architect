'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Mail, Users, ArrowRight, LogIn } from 'lucide-react';

export interface InvitationData {
    id: string;
    email: string;
    role: string;
    expires_at: string;
    project: {
        name: string;
        domain: string | null;
    };
    inviter: {
        full_name: string | null;
        email: string;
    };
}

interface InvitePageContentProps {
    token: string;
    initialInvitation: InvitationData | null;
    initialError: string | null;
}

/**
 * Client Component: Handles invite acceptance interactivity
 * - Accept button action
 * - Various UI states (needsAuth, emailMismatch, success)
 * - Redirects
 */
export function InvitePageContent({ token, initialInvitation, initialError }: InvitePageContentProps) {
    const router = useRouter();
    const [isAccepting, setIsAccepting] = useState(false);
    const [invitation] = useState<InvitationData | null>(initialInvitation);
    const [error] = useState<string | null>(initialError);
    const [success, setSuccess] = useState(false);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [emailMismatch, setEmailMismatch] = useState<{ invited: string; current: string } | null>(null);
    const [acceptError, setAcceptError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsAccepting(true);
        setAcceptError(null);

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
                setAcceptError(data.error || 'Failed to accept invitation');
            }
        } catch (err) {
            setAcceptError('Failed to accept invitation');
        } finally {
            setIsAccepting(false);
        }
    };

    // Error from initial load
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Invitation Error
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-gray-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome to the team! 🎉
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You&apos;ve successfully joined <strong>{invitation?.project?.name || 'the project'}</strong>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Redirecting to project...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (needsAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LogIn className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Sign in to continue
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
            <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Email mismatch
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                                className="block text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
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
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        You&apos;re invited!
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                        <strong>{invitation?.inviter?.full_name || invitation?.inviter?.email || 'Someone'}</strong> has
                        invited you to collaborate on:
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                            {invitation?.project?.name || 'a project'}
                        </h2>
                        {invitation?.project?.domain && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{invitation.project.domain}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Your role:</span>{' '}
                                {roleLabels[invitation?.role || 'viewer']}
                            </p>
                        </div>
                    </div>

                    {acceptError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                            {acceptError}
                        </div>
                    )}

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

                    <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
                        By accepting, you&apos;ll be able to access this project based on your assigned role.
                    </p>
                </div>
            </div>
        </div>
    );
}
