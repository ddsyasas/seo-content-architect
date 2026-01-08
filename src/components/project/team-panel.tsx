'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, UserPlus, Crown, Shield, Pencil, Eye, MoreVertical,
    Trash2, Mail, Clock, Copy, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { InviteModal } from '@/components/team/InviteModal';
import { getPlanLimits, PLANS } from '@/lib/stripe/config';
import Link from 'next/link';

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
    expires_at: string;
    created_at: string;
    token: string;
}

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown className="w-4 h-4 text-yellow-500" />,
    admin: <Shield className="w-4 h-4 text-indigo-500" />,
    editor: <Pencil className="w-4 h-4 text-green-500" />,
    viewer: <Eye className="w-4 h-4 text-gray-500" />,
};

const roleBadgeColors: Record<string, string> = {
    owner: 'bg-yellow-100 text-yellow-800',
    admin: 'bg-indigo-100 text-indigo-800',
    editor: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
};

interface TeamPanelProps {
    projectId: string;
}

export function TeamPanel({ projectId }: TeamPanelProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>('viewer');
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [teamLimit, setTeamLimit] = useState(1);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const canManageTeam = ['owner', 'admin'].includes(currentUserRole);
    const isAtLimit = members.length >= teamLimit && teamLimit !== 999999;

    useEffect(() => {
        fetchTeam();
        fetchPlanLimits();
        fetchCurrentUser();
    }, [projectId]);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            setCurrentUserEmail(user.email);
        }
    };

    const fetchPlanLimits = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get project owner's subscription
        const { data: project } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', projectId)
            .single();

        if (project) {
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('plan')
                .eq('user_id', project.user_id)
                .single();

            const plan = subscription?.plan || 'free';
            setCurrentPlan(plan);
            const limits = getPlanLimits(plan);
            setTeamLimit(limits.teamMembersPerProject);
        }
    };

    const fetchTeam = async () => {
        try {
            // Use API route which handles RLS and backfill properly
            const response = await fetch(`/api/projects/${projectId}/team`);
            const data = await response.json();

            if (!response.ok) {
                console.error('Error fetching team:', data.error);
                return;
            }

            setMembers(data.members || []);
            setInvitations(data.invitations || []);
            setCurrentUserRole(data.currentUserRole || 'viewer');
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteInvitation = async (invitationId: string, email: string) => {
        if (!confirm(`Cancel the invitation for ${email}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}/team/invite/${invitationId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to cancel invitation');
            }
        } catch (error) {
            console.error('Error canceling invitation:', error);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/team/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                setMembers(prev => prev.map(m =>
                    m.id === memberId ? { ...m, role: newRole } : m
                ));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
        setActiveDropdown(null);
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}/team/${memberId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMembers(prev => prev.filter(m => m.id !== memberId));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to remove member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
        }
        setActiveDropdown(null);
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

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                    <p className="text-gray-500 text-sm">
                        {members.length} of {teamLimit === 999999 ? '∞' : teamLimit} members • {PLANS[currentPlan as keyof typeof PLANS]?.name || 'Free'} plan
                    </p>
                </div>

                {canManageTeam && !isAtLimit && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Plan Limit Warning */}
            {isAtLimit && canManageTeam && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">Team limit reached</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Your {PLANS[currentPlan as keyof typeof PLANS]?.name} plan allows {teamLimit} team member{teamLimit !== 1 ? 's' : ''}.
                            Upgrade to add more collaborators.
                        </p>
                        <Link
                            href="/settings/subscription"
                            className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900 mt-2"
                        >
                            Upgrade Plan <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}

            {/* How to Invite - Show when no other members */}
            {members.length <= 1 && canManageTeam && !isAtLimit && (
                <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <h3 className="font-semibold text-indigo-900 mb-2">👋 Invite your team</h3>
                    <ol className="text-sm text-indigo-800 space-y-2">
                        <li className="flex gap-2">
                            <span className="font-medium">1.</span>
                            Click the "Invite Member" button above
                        </li>
                        <li className="flex gap-2">
                            <span className="font-medium">2.</span>
                            Enter their email address and choose a role
                        </li>
                        <li className="flex gap-2">
                            <span className="font-medium">3.</span>
                            Send the invitation or copy the invite link
                        </li>
                        <li className="flex gap-2">
                            <span className="font-medium">4.</span>
                            They'll get an email with a link to join your project
                        </li>
                    </ol>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Your First Team Member
                    </button>
                </div>
            )}

            {/* Team Members */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {members.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No team members found. The project owner should appear here automatically.</p>
                            <p className="text-sm mt-2">Try refreshing the page.</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                        {member.profiles?.full_name?.[0]?.toUpperCase() || member.profiles?.email?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {member.profiles?.full_name || 'Unknown User'}
                                            {member.profiles?.email === currentUserEmail && (
                                                <span className="ml-2 text-xs text-gray-500">(you)</span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {member.profiles?.email || 'No email'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadgeColors[member.role]}`}>
                                        {roleIcons[member.role]}
                                        {member.role}
                                    </span>

                                    {canManageTeam && member.role !== 'owner' && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>

                                            {activeDropdown === member.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                                                        Change Role
                                                    </div>
                                                    {['admin', 'editor', 'viewer'].filter(r => r !== member.role).map((role) => (
                                                        <button
                                                            key={role}
                                                            onClick={() => handleRoleChange(member.id, role)}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 capitalize"
                                                        >
                                                            {roleIcons[role]}
                                                            {role}
                                                        </button>
                                                    ))}
                                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                                        <button
                                                            onClick={() => handleRemoveMember(member.id, member.profiles?.full_name || 'this member')}
                                                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Remove from team
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">
                            Pending Invitations ({invitations.length})
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{invitation.email}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadgeColors[invitation.role]}`}>
                                        {roleIcons[invitation.role]}
                                        {invitation.role}
                                    </span>

                                    <button
                                        onClick={() => copyInviteLink(invitation.token)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Copy invite link"
                                    >
                                        {copiedToken === invitation.token ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleDeleteInvitation(invitation.id, invitation.email)}
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

            {/* Invite Modal */}
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                projectId={projectId}
                onInviteSent={fetchTeam}
            />
        </div>
    );
}
