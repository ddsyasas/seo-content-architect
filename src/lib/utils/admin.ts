/**
 * Super Admin utilities
 * Controls access to admin features based on environment variable
 */

/**
 * Check if a user email is a super admin
 * Super admin emails are configured in SUPER_ADMIN_EMAILS environment variable
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
    if (!email) return false;

    const superAdminEmails = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',') || [];
    return superAdminEmails.some(
        adminEmail => adminEmail.toLowerCase().trim() === email.toLowerCase().trim()
    );
}

/**
 * Server-side check for super admin (uses server env vars)
 */
export function isSuperAdminServer(email: string | null | undefined): boolean {
    if (!email) return false;

    // Try server-side env first, then fall back to public
    const superAdminEmails = (
        process.env.SUPER_ADMIN_EMAILS ||
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ||
        ''
    ).split(',');

    return superAdminEmails.some(
        adminEmail => adminEmail.toLowerCase().trim() === email.toLowerCase().trim()
    );
}
