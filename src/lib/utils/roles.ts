/**
 * Role-based access control utilities
 * 
 * Role hierarchy (most to least permissions):
 * - owner: Full access to everything
 * - admin: Can manage team + all editor permissions
 * - editor: Can create/edit content (nodes, articles, canvas)
 * - viewer: Read-only access
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface RolePermissions {
    canEdit: boolean;        // Can edit nodes, articles, canvas
    canManageTeam: boolean;  // Can invite, remove, change roles
    canDelete: boolean;      // Can delete nodes, articles
    canManageProject: boolean; // Can delete project, change settings
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
        case 'admin':
            return {
                canEdit: true,
                canManageTeam: true,
                canDelete: true,
                canManageProject: false,
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
    return ['owner', 'admin', 'editor'].includes(role);
}

export function canManageTeam(role: UserRole): boolean {
    return ['owner', 'admin'].includes(role);
}

export function canDeleteContent(role: UserRole): boolean {
    return ['owner', 'admin', 'editor'].includes(role);
}
