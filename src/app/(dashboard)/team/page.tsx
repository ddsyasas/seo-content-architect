'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Loader2, Users, Crown, Shield, Pencil, Eye,
    MoreVertical, Trash2, FolderKanban, Check, X,
    ChevronDown, AlertCircle
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
    assigned_projects: string[];
}

interface Project {
    id: string;
    name: string;
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

export default function TeamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [teamLimit, setTeamLimit] = useState(1);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    useEffect(() => {
        loadTeamData();
    }, []);

    const loadTeamData = async () => {
        try {
            const response = await fetch('/api/team');
            const data = await response.json();

            if (response.status === 403 && data.plan === 'free') {
                setCurrentPlan('free');
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                console.error('Failed to load team:', data.error);
                setIsLoading(false);
                return;
            }

            setMembers(data.members || []);
            setProjects(data.projects || []);
            setCurrentPlan(data.plan);
            setTeamLimit(data.teamLimit);
            setCurrentUserEmail(data.currentUserEmail || '');
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading team:', error);
            setIsLoading(false);
        }
    };

    const handleProjectToggle = async (memberId: string, userId: string, projectId: string, currentlyAssigned: boolean) => {
        try {
            const member = members.find(m => m.user_id === userId);

            const response = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    projectId,
                    role: member?.role || 'editor',
                    action: currentlyAssigned ? 'unassign' : 'assign',
                }),
            });

            if (!response.ok) {
                console.error('Failed to toggle project assignment');
                return;
            }

            // Reload
            await loadTeamData();
        } catch (error) {
            console.error('Error toggling project assignment:', error);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingRole(userId);
        try {
            const response = await fetch(`/api/team/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                console.error('Failed to update role');
                return;
            }

            await loadTeamData();
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setUpdatingRole(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Free plan - should not reach here due to nav hiding, but just in case
    if (currentPlan === 'free') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Feature</h2>
                <p className="text-gray-600 mb-6">
                    Upgrade to Pro or Agency to invite team members and collaborate on projects.
                </p>
                <Link
                    href="/settings/subscription"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                    Upgrade Now
                </Link>
            </div>
        );
    }

    const ownerMember = members.find(m => m.role === 'owner');
    const otherMembers = members.filter(m => m.role !== 'owner');

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Team</h1>
                    <p className="text-gray-600">
                        {members.length} member{members.length !== 1 ? 's' : ''} • {PLANS[currentPlan as keyof typeof PLANS]?.name} plan
                    </p>
                </div>

                <Link
                    href="/settings/team"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Users className="w-4 h-4" />
                    Manage & Invite
                </Link>
            </div>

            {/* Owner - Always full access */}
            {ownerMember && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Owner</h3>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {ownerMember.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {ownerMember.profiles?.full_name || 'Unknown'}
                                        {ownerMember.profiles?.email === currentUserEmail && (
                                            <span className="ml-2 text-xs text-gray-500">(you)</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">{ownerMember.profiles?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                    <Crown className="w-4 h-4" />
                                    Owner
                                </span>
                                <span className="text-sm text-gray-500">Full access to all projects</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members */}
            <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Team Members</h3>

                {otherMembers.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">No team members yet</p>
                        <p className="text-sm text-gray-500">
                            Invite people from <Link href="/settings/team" className="text-indigo-600 hover:underline">Settings → Team</Link>
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {otherMembers.map((member) => (
                                <div key={member.user_id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {member.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {member.profiles?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-sm text-gray-500">{member.profiles?.email}</p>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                disabled={updatingRole === member.user_id}
                                                className={`appearance-none cursor-pointer pr-8 pl-3 py-1.5 rounded-lg text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${member.role === 'editor' ? 'bg-green-50 border-green-200 text-green-700' :
                                                        'bg-gray-50 border-gray-200 text-gray-700'
                                                    } ${updatingRole === member.user_id ? 'opacity-50' : ''}`}
                                            >
                                                <option value="editor">Editor</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Project Assignments */}
                                    <div className="mt-4 pl-16">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Assigned Projects:</p>

                                        {/* Assigned Projects with X to remove */}
                                        {member.assigned_projects.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {projects.filter(p => member.assigned_projects.includes(p.id)).map((project) => (
                                                    <span
                                                        key={project.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-200"
                                                    >
                                                        <FolderKanban className="w-3.5 h-3.5" />
                                                        {project.name}
                                                        <button
                                                            onClick={() => handleProjectToggle(member.id, member.user_id, project.id, true)}
                                                            className="ml-1 p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                                                            title="Remove from project"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Unassigned Projects as checkboxes */}
                                        {projects.filter(p => !member.assigned_projects.includes(p.id)).length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500 mb-1">Add to project:</p>
                                                {projects.filter(p => !member.assigned_projects.includes(p.id)).map((project) => (
                                                    <label
                                                        key={project.id}
                                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={false}
                                                            onChange={() => handleProjectToggle(member.id, member.user_id, project.id, false)}
                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-600">{project.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {member.assigned_projects.length === 0 && (
                                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                No projects assigned - user cannot access any content
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
