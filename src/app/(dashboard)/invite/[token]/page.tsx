import { prisma } from '@/lib/prisma';
import { InvitePageContent, type InvitationData } from './invite-content';

/**
 * Server Component: Invitation acceptance page
 * Fetches invitation data server-side using Prisma
 */
export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    let invitation: InvitationData | null = null;
    let error: string | null = null;

    try {
        // Fetch invitation with project and inviter details using Prisma
        const invitationData = await prisma.team_invitations.findFirst({
            where: { token },
            select: {
                id: true,
                email: true,
                role: true,
                expires_at: true,
                accepted_at: true,
                projects: {
                    select: {
                        name: true,
                        domain: true,
                    },
                },
                profiles: {
                    select: {
                        full_name: true,
                        email: true,
                    },
                },
            },
        });

        if (!invitationData) {
            error = 'This invitation link is invalid or not found.';
        } else if (invitationData.accepted_at) {
            error = 'This invitation has already been used.';
        } else if (invitationData.expires_at && new Date(invitationData.expires_at) < new Date()) {
            error = 'This invitation has expired.';
        } else {
            invitation = {
                id: invitationData.id,
                email: invitationData.email,
                role: invitationData.role || 'viewer',
                expires_at: invitationData.expires_at?.toISOString() || '',
                project: {
                    name: invitationData.projects?.name || 'Unknown Project',
                    domain: invitationData.projects?.domain || null,
                },
                inviter: {
                    full_name: invitationData.profiles?.full_name || null,
                    email: invitationData.profiles?.email || '',
                },
            };
        }
    } catch (err) {
        console.error('Error fetching invitation:', err);
        error = 'Failed to load invitation details.';
    }

    return (
        <InvitePageContent
            token={token}
            initialInvitation={invitation}
            initialError={error}
        />
    );
}
