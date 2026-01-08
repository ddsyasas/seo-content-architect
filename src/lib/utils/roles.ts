/**
 * Role-based access control utilities
 * 
 * Role hierarchy (most to least permissions):
 * - owner: Full access to everything (can delete project, manage team)
 * - editor: Can create/edit content and edit project settings
 * - viewer: Read-only access
 */

export type UserRole = 'owner' | 'editor' | 'viewer';

export interface RolePermissions {
    canEdit: boolean;          // Can edit nodes, articles, canvas, project settings
    canManageTeam: boolean;    // Can invite, remove, change roles
    canDelete: boolean;        // Can delete nodes, articles
    canManageProject: boolean; // Can delete project (owner only)
}

export function getRolePermissions(role: UserRole): RolePermissions {
    switch (role) {
        case 'owner':
            return {
                canEdit: true,
                canManageTeam: true,
                canDelete: true,
                canManageProject: true,
            };
        case 'editor':
            return {
                canEdit: true,
                canManageTeam: false,
                canDelete: true,
                canManageProject: false,
            };
        case 'viewer':
            return {
                canEdit: false,
                canManageTeam: false,
                canDelete: false,
                canManageProject: false,
            };
        default:
            return {
                canEdit: false,
                canManageTeam: false,
                canDelete: false,
                canManageProject: false,
            };
    }
}

export function canEditContent(role: UserRole): boolean {
    return ['owner', 'editor'].includes(role);
}

export function canManageTeam(role: UserRole): boolean {
    return role === 'owner';
}

export function canDeleteContent(role: UserRole): boolean {
    return ['owner', 'editor'].includes(role);
}
