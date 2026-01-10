import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeSubscriptionEmail } from '@/lib/email/brevo';

/**
 * POST /api/billing/send-welcome-email
 * Sends welcome email for subscription (called from checkout success page)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan } = body as { plan: 'pro' | 'agency' };

        if (!plan || (plan !== 'pro' && plan !== 'agency')) {
            return NextResponse.json({ error: 'Valid plan required (pro or agency)' }, { status: 400 });
        }

        // Get user profile for email
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();

        if (!profile?.email) {
            // Fallback to user email from auth
            const email = user.email;
            if (!email) {
                return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
            }

            await sendWelcomeSubscriptionEmail({
                to: email,
                plan,
            });
        } else {
            await sendWelcomeSubscriptionEmail({
                to: profile.email,
                toName: profile.full_name || undefined,
                plan,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Send welcome email error:', error);
        return NextResponse.json(
            { error: 'Failed to send welcome email' },
            { status: 500 }
        );
    }
}
