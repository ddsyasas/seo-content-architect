'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const BREVO_SYNCED_KEY = 'brevo_user_synced';

/**
 * Hook to ensure OAuth users are synced to Brevo
 * This is a fallback for when the OAuth callback doesn't run
 * (e.g., when Supabase redirects to production instead of localhost)
 */
export function useBrevoSync() {
    const syncAttempted = useRef(false);

    useEffect(() => {
        // Only run once per session
        if (syncAttempted.current) return;
        syncAttempted.current = true;

        // Check if already synced in this browser
        if (sessionStorage.getItem(BREVO_SYNCED_KEY)) return;

        const syncUser = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return;

                // Check if this is an OAuth user (has identity provider)
                const isOAuthUser = user.app_metadata?.provider !== 'email';
                if (!isOAuthUser) return;

                // Check if user was created recently (within last 5 minutes)
                const createdAt = new Date(user.created_at).getTime();
                const now = Date.now();
                const fiveMinutes = 5 * 60 * 1000;

                if (now - createdAt > fiveMinutes) {
                    // Not a new user, mark as synced and skip
                    sessionStorage.setItem(BREVO_SYNCED_KEY, 'true');
                    return;
                }

                // Extract name from user metadata
                const fullName = user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split('@')[0] ||
                    'User';

                console.log('[Brevo Sync] Syncing new OAuth user:', user.email);

                // Add to Brevo user list
                const response = await fetch('/api/newsletter/subscribe-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        name: fullName,
                    }),
                });

                if (response.ok) {
                    console.log('[Brevo Sync] User synced successfully');
                } else {
                    console.error('[Brevo Sync] Failed to sync user:', await response.text());
                }

                // Mark as synced regardless of result to avoid repeated attempts
                sessionStorage.setItem(BREVO_SYNCED_KEY, 'true');
            } catch (error) {
                console.error('[Brevo Sync] Error:', error);
            }
        };

        syncUser();
    }, []);
}
