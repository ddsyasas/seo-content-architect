'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Loader2, UserPlus, Mail, Clock, Copy, Check, Trash2,
    Crown, Shield, Pencil, Eye, AlertCircle, Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPlanLimits, PLANS } from '@/lib/stripe/config';

interface TeamMember {
    id: string;
    role: string;
    joined_at: string;
    user_id: string;
    profiles: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    token: string;
    expires_at: string;
    created_at: string;
    project_id: string;
}

const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Can manage team and all projects', icon: Shield },
    { value: 'editor', label: 'Editor', description: 'Can create and edit content', icon: Pencil },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access', icon: Eye },
];

const roleBadgeColors: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-800',
    editor: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
};

export default function SettingsTeamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [teamLimit, setTeamLimit] = useState(1);

    // Invite form
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Use the /api/team endpoint for members
            const teamResponse = await fetch('/api/team');
            const teamData = await teamResponse.json();

            if (teamResponse.status === 403 && teamData.plan === 'free') {
                setCurrentPlan('free');
                setIsLoading(false);
                return;
            }

            if (teamResponse.ok) {
                setMembers(teamData.members || []);
                setCurrentPlan(teamData.plan);
                setTeamLimit(teamData.teamLimit);
            }

            // Also get pending invitations
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: projects } = await supabase
                .from('projects')
                .select('id')
                .eq('user_id', user.id);

            if (projects && projects.length > 0) {
                const projectIds = projects.map(p => p.id);

                const { data: inviteData } = await supabase
                    .from('team_invitations')
                    .select('*')
                    .in('project_id', projectIds)
                    .is('accepted_at', null)
                    .gt('expires_at', new Date().toISOString());

                setInvitations(inviteData || []);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        setInviteError(null);
        setInviteSuccess(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check team member limit FIRST
            const limitCheck = await fetch('/api/limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'team' }),
            }).then(r => r.json());

            if (!limitCheck.allowed) {
                setInviteError(limitCheck.message || `Team member limit reached (${teamLimit}). Upgrade your plan to add more members.`);
                return;
            }

            const { data: projects } = await supabase
                .from('projects')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

            if (!projects || projects.length === 0) {
                setInviteError('You need at least one project to invite team members');
                return;
            }

            const response = await fetch(`/api/projects/${projects[0].id}/team/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setInviteSuccess(`Invitation sent to ${email}!`);
            setEmail('');
            setRole('editor');
            loadData();
        } catch (err) {
            setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleDeleteInvitation = async (invId: string, invEmail: string, projectId: string) => {
        if (!confirm(`Cancel invitation for ${invEmail}?`)) return;

        try {
            const response = await fetch(`/api/projects/${projectId}/team/invite/${invId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setInvitations(prev => prev.filter(inv => inv.id !== invId));
            }
        } catch (error) {
            console.error('Error deleting invitation:', error);
        }
    };

    const handleRemoveMember = async (member: TeamMember) => {
        const memberName = member.profiles?.full_name || member.profiles?.email || 'this member';
        if (!confirm(`Remove ${memberName} from your team? This will revoke their access to all projects.`)) return;

        try {
            const response = await fetch(`/api/team/${member.user_id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error('Failed to remove member');
                return;
            }

            loadData();
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const handleRoleChange = async (member: TeamMember, newRole: string) => {
        try {
            const response = await fetch(`/api/team/${member.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                console.error('Failed to update role');
                return;
            }

            // Update local state
            setMembers(prev => prev.map(m =>
                m.user_id === member.user_id ? { ...m, role: newRole } : m
            ));
        } catch (error) {
            console.error('Error changing role:', error);
        }
    };

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (currentPlan === 'free') {
        return (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Feature</h2>
                <p className="text-gray-600 mb-4">
                    Upgrade to Pro or Agency to invite team members.
                </p>
                <Link
                    href="/settings/subscription"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                    Upgrade Now
                </Link>
            </div>
        );
    }

    // Only count accepted members (not including owner)
    const acceptedMemberCount = members.filter(m => m.role !== 'owner').length;
    const isAtLimit = acceptedMemberCount >= teamLimit;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Team</h2>
                <p className="text-gray-600">
                    Invite team members and manage access • {acceptedMemberCount} of {teamLimit} members
                </p>
            </div>

            {/* Invite Form */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                    <UserPlus className="w-5 h-5 inline mr-2" />
                    Invite New Member
                </h3>

                {isAtLimit ? (
                    <div className="flex items-start gap-3 text-amber-800 bg-amber-50 p-4 rounded-lg">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">Team limit reached</p>
                            <p className="text-sm mt-1">
                                Your {PLANS[currentPlan as keyof typeof PLANS]?.name} plan allows {teamLimit} team members.
                                <Link href="/settings/subscription" className="ml-1 underline">Upgrade</Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleInvite} className="space-y-4">
                        {inviteError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                                {inviteError}
                            </div>
                        )}

                        {inviteSuccess && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                                {inviteSuccess}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {roleOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label} - {opt.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isInviting || !email}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isInviting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Mail className="w-4 h-4" />
                            )}
                            Send Invitation
                        </button>
                    </form>
                )}
            </div>

            {/* Accepted Team Members */}
            {members.filter(m => m.role !== 'owner').length > 0 && (
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                        <Users className="w-5 h-5 inline mr-2" />
                        Team Members ({acceptedMemberCount})
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {members.filter(m => m.role !== 'owner').map((member) => (
                            <div key={member.user_id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                        {member.profiles?.full_name?.[0]?.toUpperCase() || member.profiles?.email?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {member.profiles?.full_name || member.profiles?.email || 'Unknown'}
                                        </p>
                                        {member.profiles?.full_name && (
                                            <p className="text-sm text-gray-500">{member.profiles.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member, e.target.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer focus:ring-2 focus:ring-indigo-500 ${roleBadgeColors[member.role]}`}
                                    >
                                        {roleOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleRemoveMember(member)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove member"
                                    >
                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                        <Clock className="w-5 h-5 inline mr-2" />
                        Pending Invitations ({invitations.length})
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{inv.email}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Expires {new Date(inv.expires_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadgeColors[inv.role]}`}>
                                        {inv.role}
                                    </span>
                                    <button
                                        onClick={() => copyInviteLink(inv.token)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Copy invite link"
                                    >
                                        {copiedToken === inv.token ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteInvitation(inv.id, inv.email, inv.project_id)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Cancel invitation"
                                    >
                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Link to Dashboard Team */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-indigo-800">
                    💡 <strong>Tip:</strong> Go to{' '}
                    <Link href="/team" className="underline font-medium">Dashboard → Team</Link>{' '}
                    to assign team members to specific projects.
                </p>
            </div>
        </div>
    );
}
