import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors (user cancelled, denied access, etc.)
    if (error) {
        console.log(`[Auth Callback] OAuth error: ${error} - ${errorDescription}`);
        // User cancelled or denied - just redirect back to login without error message
        if (error === 'access_denied') {
            return NextResponse.redirect(`${origin}/login`);
        }
        // Other errors - show error on login page
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
    }

    // No code provided - user probably hit back button or bookmarked this URL
    if (!code) {
        return NextResponse.redirect(`${origin}/login`);
    }

    // Exchange code for session
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
        console.error('[Auth Callback] Session exchange error:', sessionError);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (data.user) {
        // For OAuth users, add them to Brevo (non-blocking)
        // This handles users who sign up via Google
        const user = data.user;

        // Check if this is a new user by comparing timestamps (within 60 seconds tolerance)
        const createdAt = new Date(user.created_at).getTime();
        const lastSignIn = new Date(user.last_sign_in_at || user.created_at).getTime();
        const isNewUser = Math.abs(createdAt - lastSignIn) < 60000; // Within 60 seconds

        console.log(`[Auth Callback] User ${user.email}, created: ${user.created_at}, last_sign_in: ${user.last_sign_in_at}, isNewUser: ${isNewUser}`);

        if (isNewUser) {
            // Extract name from user metadata
            const fullName = user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'User';

            console.log(`[Auth Callback] Adding new OAuth user to Brevo: ${user.email}, name: ${fullName}`);

            // Add to Brevo user list (fire and forget)
            fetch(`${origin}/api/newsletter/subscribe-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name: fullName,
                }),
            }).then(res => {
                console.log(`[Auth Callback] Brevo subscribe-user response: ${res.status}`);
            }).catch((err) => {
                console.error('[Auth Callback] Brevo subscribe-user error:', err);
            });
        }

        // Redirect to the intended destination
        return NextResponse.redirect(`${origin}${next}`);
    }

    // Fallback - redirect to login
    return NextResponse.redirect(`${origin}/login`);
}
